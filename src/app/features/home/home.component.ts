import { Component } from '@angular/core';
import { NavbarComponent } from "../navbar/navbar.component";
import { TestimonialsComponent } from '../testimonials/testimonials.component';
import { FooterComponent } from '../footer/footer.component';
import { AboutComponent } from "../about/about.component";

@Component({
  selector: 'app-home',
  imports: [NavbarComponent, TestimonialsComponent, FooterComponent, AboutComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {

}
