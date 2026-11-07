import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TocItem } from '../../models/article.model';

@Component({
  selector: 'app-article-toc',
  standalone: true,
  templateUrl: './article-toc.component.html',
  styleUrl: './article-toc.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArticleTocComponent {
  readonly items = input.required<TocItem[]>();
  readonly activeId = input('');
  readonly label = input('On this page');

  scrollTo(event: Event, id: string): void {
    event.preventDefault();
    const target = document.getElementById(id);
    if (!target) {
      return;
    }

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    const url = new URL(window.location.href);
    url.hash = id;
    history.replaceState(null, '', url);
  }
}
