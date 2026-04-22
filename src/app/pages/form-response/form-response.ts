import { Component, ViewChild, AfterViewInit, OnInit, ElementRef, OnDestroy } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { ActivatedRoute } from '@angular/router';
import { FormService } from '../../services/form-service';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import * as XLSX from 'xlsx';
import { Chart, registerables } from 'chart.js';
import { FormResponseData } from '../../interfaces/form-response-schema';
import { Form } from '../../interfaces/form-schema';
import { ToastrService } from 'ngx-toastr';

Chart.register(...registerables);

const C_PRIMARY = '#6750A4';
const C_PRIMARY_SOFT = '#E8DEF8';
const C_MUTED = '#79747E';
const C_GRID = 'rgba(0,0,0,0.06)';

const C_PALETTE = [
  '#6750A4',
  '#7B61FF',
  '#A78BFA',
  '#C4B5FD',
  '#DDD6FE',
  '#EDE9FE',
  '#F5F3FF',
  '#4C1D95',
];

const CHOICE_TYPES = new Set([
  'checkbox',
  'radio',
  'select',
  'dropdown',
  'multi-select',
  'multiselect',
]);

const TEXT_TYPES = new Set([
  'text',
  'input',
  'textarea',
  'email',
  'number',
  'tel',
  'url',
  'date',
  'time',
]);

export interface FieldChartConfig {
  fieldId: string;
  label: string;
  fieldType: string;
  chartType: 'doughnut' | 'bar' | 'text-stats';
  canvasId: string;
  stats?: { total: number; filled: number; empty: number; avgLength: number };
}

@Component({
  selector: 'app-form-response',
  standalone: true,
  imports: [
    MatTableModule,
    DragDropModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatPaginatorModule,
    MatSortModule,
    ReactiveFormsModule,
  ],
  templateUrl: './form-response.html',
  styleUrl: './form-response.css',
})
export class FormResponse implements OnInit, AfterViewInit, OnDestroy {
  displayedColumns: string[] = ['slNo', 'submittedAt'];
  dataSource = new MatTableDataSource<Record<string, any>>([]);
  isLoading = true;
  formTitle = '';
  fieldLabelMap: Record<string, string> = {};
  completionChartSubtitle = '';
  searchControl = new FormControl('');
  fieldCharts: FieldChartConfig[] = [];
  previewResponse: Record<string, any> | null = null;

  private completionChart: Chart | null = null;
  private timelineChart: Chart | null = null;
  private weekdayChart: Chart | null = null;
  private fieldChartInstances: Chart[] = [];
  private destroy$ = new Subject<void>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('completionCanvas') completionCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('timelineCanvas') timelineCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('weekdayCanvas') weekdayCanvas!: ElementRef<HTMLCanvasElement>;

  constructor(
    private route: ActivatedRoute,
    private formService: FormService,
    private toastr: ToastrService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.fetchData(id);
    this.setupDebouncedSearch();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  ngOnDestroy(): void {
    this.completionChart?.destroy();
    this.timelineChart?.destroy();
    this.weekdayChart?.destroy();
    this.fieldChartInstances.forEach((c) => c.destroy());
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupDebouncedSearch(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(750), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((value) => {
        this.dataSource.filter = (value ?? '').trim().toLowerCase();
        if (this.dataSource.paginator) {
          this.dataSource.paginator.firstPage();
        }
      });
  }

  fetchData(id: string): void {
    forkJoin({
      form: this.formService.getFormById(id),
      responses: this.formService.getAllFormResponsesById(id),
      respondents: this.formService.getUniqueRespondentsByFormId(id),
      assignees: this.formService.getUniqueAssigneesByFormId(id),
    }).subscribe({
      next: ({ form, responses, respondents, assignees }) => {
        this.isLoading = false;
        this.formTitle = form.title;

        const isPrivate = form.settings?.isPrivate ?? false;
        const useResponseMode = assignees.count === 0;

        this.completionChartSubtitle = !isPrivate
          ? 'Total number of submissions'
          : useResponseMode
            ? 'Unique responders out of total submissions'
            : 'Unique respondents out of assigned users';

        this.fieldLabelMap = { submittedAt: 'Submit Timeline' };
        form.sections.forEach((section) => {
          section.fields.forEach((field) => {
            if (field.id) {
              this.fieldLabelMap[field.id] =
                (field.fieldConfig as any)['label'] ||
                (field.fieldConfig as any)['placeholder'] ||
                field.fieldType;
            }
          });
        });

        if (!responses || responses.length === 0) {
          const schemaKeys = form.sections
            .flatMap((s) => s.fields)
            .sort((a, b) => a.fieldOrder - b.fieldOrder)
            .map((f) => f.id!)
            .filter(Boolean);
          this.displayedColumns = ['slNo', 'submittedAt', ...schemaKeys];
          this.dataSource.data = [];
        } else {
          const dynamicKeys = Object.keys(responses[0].response || {});
          this.displayedColumns = ['slNo', 'submittedAt', ...dynamicKeys];
          this.dataSource.data = responses.map((res) => ({
            submittedAt: new Date(res.submittedAt),
            ...res.response,
          }));
          this.setupFilter();
        }

        this.initCompletionChart(respondents.count, assignees.count, isPrivate);
        this.initTimelineChart(responses ?? []);
        this.initWeekdayChart(responses ?? []);
        this.buildFieldCharts(form, responses ?? []);
      },
      error: () => {
        this.isLoading = false;
        this.displayedColumns = ['slNo', 'submittedAt'];
        this.dataSource.data = [];
      },
    });
  }

  private initCompletionChart(responded: number, total: number, isPrivate: boolean): void {
    const ctx = this.completionCanvas.nativeElement.getContext('2d')!;
    const totalResponses = this.dataSource.data.length;

    if (!isPrivate) {
      this.completionChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Responses'],
          datasets: [
            {
              data: [totalResponses, 1],
              backgroundColor: [C_PRIMARY, 'transparent'],
              borderWidth: 0,
              hoverOffset: 0,
            },
          ],
        },
        options: {
          cutout: '74%',
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { display: false },
            tooltip: { enabled: false },
          },
        },
        plugins: [
          {
            id: 'centerText',
            afterDraw: (chart) => {
              const {
                ctx: c,
                chartArea: { width, height, left, top },
              } = chart;
              const cx = left + width / 2;
              const cy = top + height / 2;
              c.save();
              c.font = 'bold 36px sans-serif';
              c.fillStyle = C_PRIMARY;
              c.textAlign = 'center';
              c.textBaseline = 'middle';
              c.fillText(`${totalResponses}`, cx, cy - 12);
              c.font = '12px sans-serif';
              c.fillStyle = C_MUTED;
              c.fillText('responses received', cx, cy + 14);
              c.restore();
            },
          },
        ],
      });
      return;
    }

    const useResponseMode = total === 0;
    const chartFilled = responded;
    const chartTotal = useResponseMode ? totalResponses : total;
    const chartPending = Math.max(0, chartTotal - chartFilled);
    const pct = chartTotal > 0 ? Math.round((chartFilled / chartTotal) * 100) : 0;

    const labels = useResponseMode
      ? ['Unique Responders', 'Repeat Responses']
      : ['Responded', 'Pending'];
    const centerBottom = useResponseMode
      ? `${chartFilled} unique / ${chartTotal} total`
      : `${chartFilled} / ${chartTotal}`;

    this.completionChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data: [chartFilled, chartPending],
            backgroundColor: [C_PRIMARY, C_PRIMARY_SOFT],
            borderWidth: 0,
            hoverOffset: 6,
          },
        ],
      },
      options: {
        cutout: '74%',
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { padding: 16, font: { size: 12 }, color: C_MUTED },
          },
          tooltip: { callbacks: { label: (c) => ` ${c.parsed} responses` } },
        },
      },
      plugins: [
        {
          id: 'centerText',
          afterDraw: (chart: any) => {
            const {
              ctx: c,
              chartArea: { width, height, left, top },
            } = chart;
            const cx = left + width / 2;
            const cy = top + height / 2;
            c.save();
            c.font = 'bold 24px sans-serif';
            c.fillStyle = C_PRIMARY;
            c.textAlign = 'center';
            c.textBaseline = 'middle';
            c.fillText(`${pct}%`, cx, cy - 10);
            c.font = '12px sans-serif';
            c.fillStyle = C_MUTED;
            c.fillText(centerBottom, cx, cy + 12);
            c.restore();
          },
        },
      ],
    });
  }

  private initTimelineChart(responses: FormResponseData[]): void {
    const ctx = this.timelineCanvas.nativeElement.getContext('2d')!;
    const { labels, counts } = this.buildTimelineData(responses);

    this.timelineChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Responses',
            data: counts,
            borderColor: C_PRIMARY,
            backgroundColor: 'rgba(103,80,164,0.08)',
            borderWidth: 2,
            pointBackgroundColor: C_PRIMARY,
            pointRadius: 4,
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
          tooltip: { mode: 'index', intersect: false },
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 11 }, color: C_MUTED } },
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1, font: { size: 11 }, color: C_MUTED },
            grid: { color: C_GRID },
          },
        },
      },
    });
  }

  private initWeekdayChart(responses: FormResponseData[]): void {
    const ctx = this.weekdayCanvas.nativeElement.getContext('2d')!;
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const counts = new Array(7).fill(0);

    responses.forEach((res) => {
      const d = new Date(res.submittedAt);
      if (!isNaN(d.getTime())) counts[d.getDay()]++;
    });

    const max = Math.max(...counts);

    this.weekdayChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: days,
        datasets: [
          {
            label: 'Responses',
            data: counts,
            backgroundColor: counts.map((c) => (c === max && max > 0 ? C_PRIMARY : C_PRIMARY_SOFT)),
            borderRadius: 6,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (c) => ` ${c.parsed.y} responses` } },
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 11 }, color: C_MUTED } },
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1, font: { size: 11 }, color: C_MUTED },
            grid: { color: C_GRID },
          },
        },
      },
    });
  }

  private buildFieldCharts(form: Form, responses: FormResponseData[]): void {
    const configs: FieldChartConfig[] = [];

    form.sections
      .flatMap((s) => s.fields)
      .forEach((field) => {
        if (!field.id) return;
        const fieldId = field.id;
        const fieldType = field.fieldType.toLowerCase();
        const label =
          (field.fieldConfig as any)['label'] ||
          (field.fieldConfig as any)['placeholder'] ||
          field.fieldType;

        const rawValues: any[] = responses
          .map((r) => (r.response as any)?.[fieldId])
          .filter((v) => v !== undefined);

        if (CHOICE_TYPES.has(fieldType)) {
          const flatValues: string[] = rawValues
            .flatMap((v) => (Array.isArray(v) ? v.map(String) : [String(v)]))
            .filter((v) => v !== '' && v !== 'undefined' && v !== 'null');

          if (!flatValues.length) return;

          const countMap = new Map<string, number>();
          flatValues.forEach((v) => countMap.set(v, (countMap.get(v) ?? 0) + 1));

          configs.push({
            fieldId,
            label,
            fieldType,
            chartType: countMap.size > 4 ? 'bar' : 'doughnut',
            canvasId: `field-chart-${fieldId}`,
          });
        } else if (TEXT_TYPES.has(fieldType)) {
          const total = rawValues.length;
          const filled = rawValues.filter((v) => v !== null && v !== undefined && v !== '').length;
          const avgLength =
            filled === 0
              ? 0
              : Math.round(
                  rawValues
                    .filter((v) => v !== null && v !== undefined && v !== '')
                    .reduce((sum, v) => sum + String(v).length, 0) / filled,
                );

          configs.push({
            fieldId,
            label,
            fieldType,
            chartType: 'text-stats',
            canvasId: `field-chart-${fieldId}`,
            stats: { total, filled, empty: total - filled, avgLength },
          });
        }
      });

    this.fieldCharts = configs;
    setTimeout(() => this.renderFieldCharts(form, responses), 0);
  }

  private renderFieldCharts(form: Form, responses: FormResponseData[]): void {
    this.fieldChartInstances.forEach((c) => c.destroy());
    this.fieldChartInstances = [];

    this.fieldCharts.forEach((fc) => {
      if (fc.chartType === 'text-stats') return;

      const canvasEl = document.getElementById(fc.canvasId) as HTMLCanvasElement | null;
      if (!canvasEl) return;
      const ctx = canvasEl.getContext('2d');
      if (!ctx) return;

      const rawValues: any[] = responses
        .map((r) => (r.response as any)?.[fc.fieldId])
        .filter((v) => v !== undefined);

      const flatValues: string[] = rawValues
        .flatMap((v) => (Array.isArray(v) ? v.map(String) : [String(v)]))
        .filter((v) => v !== '' && v !== 'undefined' && v !== 'null');

      const countMap = new Map<string, number>();
      flatValues.forEach((v) => countMap.set(v, (countMap.get(v) ?? 0) + 1));

      const optionLabels = Array.from(countMap.keys());
      const optionCounts = Array.from(countMap.values());

      if (fc.chartType === 'doughnut') {
        const total = optionCounts.reduce((a, b) => a + b, 0);

        this.fieldChartInstances.push(
          new Chart(ctx, {
            type: 'doughnut',
            data: {
              labels: optionLabels,
              datasets: [
                {
                  data: optionCounts,
                  backgroundColor: optionLabels.map((_, i) => C_PALETTE[i % C_PALETTE.length]),
                  borderWidth: 0,
                  hoverOffset: 6,
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: true,
              plugins: {
                legend: {
                  position: 'bottom',
                  labels: { padding: 12, font: { size: 11 }, color: C_MUTED },
                },
                tooltip: {
                  callbacks: {
                    label: (c) => {
                      const pct = total > 0 ? Math.round((c.parsed / total) * 100) : 0;
                      return ` ${c.parsed} responses (${pct}%)`;
                    },
                  },
                },
              },
            },
          }),
        );
      } else {
        const totalBar = optionCounts.reduce((a, b) => a + b, 0);
        const max = Math.max(...optionCounts);

        this.fieldChartInstances.push(
          new Chart(ctx, {
            type: 'bar',
            data: {
              labels: optionLabels,
              datasets: [
                {
                  label: 'Responses',
                  data: optionCounts,
                  backgroundColor: optionCounts.map((c) =>
                    c === max && max > 0 ? C_PRIMARY : C_PRIMARY_SOFT,
                  ),
                  borderRadius: 6,
                  borderSkipped: false,
                },
              ],
            },
            options: {
              indexAxis: 'y',
              responsive: true,
              maintainAspectRatio: true,
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    label: (c) => {
                      const pct =
                        totalBar > 0 ? Math.round(((c.parsed as any).x / totalBar) * 100) : 0;
                      return ` ${(c.parsed as any).x} responses (${pct}%)`;
                    },
                  },
                },
              },
              scales: {
                x: {
                  beginAtZero: true,
                  ticks: {
                    stepSize: 1,
                    font: { size: 11 },
                    color: C_MUTED,
                    callback: (value) => {
                      const pct = totalBar > 0 ? Math.round((Number(value) / totalBar) * 100) : 0;
                      return `${value} (${pct}%)`;
                    },
                  },
                  grid: { color: C_GRID },
                },
                y: { grid: { display: false }, ticks: { font: { size: 11 }, color: C_MUTED } },
              },
            },
          }),
        );
      }
    });
  }

  openPreview(row: Record<string, any>): void {
    this.previewResponse = row;
  }

  closePreview(): void {
    this.previewResponse = null;
  }

  private buildTimelineData(responses: FormResponseData[]): { labels: string[]; counts: number[] } {
    if (!responses.length) return { labels: [], counts: [] };

    const dates = responses
      .map((r) => new Date(r.submittedAt))
      .filter((d) => !isNaN(d.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());

    if (!dates.length) return { labels: [], counts: [] };

    const useHour = (dates[dates.length - 1].getTime() - dates[0].getTime()) / 3_600_000 <= 24;
    const buckets = new Map<string, number>();

    dates.forEach((d) => {
      const key = useHour
        ? `${d.getHours().toString().padStart(2, '0')}:00`
        : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    });

    return { labels: Array.from(buckets.keys()), counts: Array.from(buckets.values()) };
  }

  getColumnLabel(column: string): string {
    return this.fieldLabelMap[column] ?? column;
  }

  formatLabelTruncated(label: string, maxLength: number = 21): string {
    return label.length > maxLength ? label.slice(0, maxLength) + '…' : label;
  }

  setupFilter(): void {
    this.dataSource.filterPredicate = (data, filter) =>
      Object.values(data).join(' ').toLowerCase().includes(filter);
  }

  drop(event: CdkDragDrop<string[]>): void {
    const cols = [...this.displayedColumns];
    moveItemInArray(cols, event.previousIndex + 1, event.currentIndex + 1);
    this.displayedColumns = cols;
  }

  getSerialNumber(rowIndex: number): number {
    const pageIndex = this.paginator?.pageIndex ?? 0;
    const pageSize = this.paginator?.pageSize ?? 10;
    return pageIndex * pageSize + rowIndex + 1;
  }

  formatValue(value: any): string {
    if (value === null || value === undefined || value === '') return '---';
    if (value instanceof Date) return value.toLocaleString();
    if (Array.isArray(value)) {
      const clean = value.map(String).filter((v) => v !== '' && v !== 'null' && v !== 'undefined');
      return clean.length ? clean.join(', ') : '---';
    }
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }

  formatValueTruncated(value: any, maxLength: number = 21): string {
    const full = this.formatValue(value);
    if (full === '---') return full;
    return full.length > maxLength ? full.slice(0, maxLength) + '…' : full;
  }

  downloadAsExcel(): void {
    const data = this.dataSource.data;
    if (!data?.length) return;

    const formattedData = data.map((row, index) => {
      const newRow: any = {};
      this.displayedColumns.forEach((col) => {
        newRow[this.getColumnLabel(col)] =
          col === 'slNo' ? this.getSerialNumber(index) : this.formatValue(row[col]);
      });
      return newRow;
    });

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    XLSX.writeFile(
      { Sheets: { Responses: worksheet }, SheetNames: ['Responses'] },
      `${this.formTitle || 'responses'}.xlsx`,
    );
    this.toastr.success('File downloaded successfully!!');
  }

  downloadAsCsv(): void {
    const data = this.dataSource.data;
    if (!data?.length) return;

    const headers = this.displayedColumns.map((col) => this.getColumnLabel(col));
    const rows = data.map((row, index) =>
      this.displayedColumns.map((col) =>
        col === 'slNo' ? this.getSerialNumber(index) : this.formatValue(row[col]),
      ),
    );

    const csvContent = [headers, ...rows]
      .map((row) => row.map((v) => `"${v}"`).join(','))
      .join('\n');

    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }));
    a.download = `${this.formTitle || 'responses'}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    this.toastr.success('File downloaded successfully!!');
  }
}
