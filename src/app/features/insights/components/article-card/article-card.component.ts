import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ArticleSummary } from '../../models/article.model';
import { formatInsightDate } from '../../utils/article-content';

@Component({
  selector: 'app-article-card',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './article-card.component.html',
  styleUrl: './article-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArticleCardComponent {
  readonly article = input.required<ArticleSummary>();
  readonly variant = input<'grid' | 'feature' | 'compact'>('grid');
  readonly formatDate = formatInsightDate;
}
