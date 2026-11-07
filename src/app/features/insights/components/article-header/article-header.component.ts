import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ArticleSummary } from '../../models/article.model';
import { formatInsightDate } from '../../utils/article-content';

@Component({
  selector: 'app-article-header',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './article-header.component.html',
  styleUrl: './article-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArticleHeaderComponent {
  readonly article = input.required<ArticleSummary>();
  readonly formatDate = formatInsightDate;
}
