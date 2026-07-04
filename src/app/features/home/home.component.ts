import { Component } from '@angular/core';
import { NavbarComponent } from "../navbar/navbar.component";
import { TestimonialsComponent } from '../testimonials/testimonials.component';
import { FooterComponent } from '../footer/footer.component';
import { AboutComponent } from "../about/about.component";
import { ServicesComponent } from '../services/services.component';

@Component({
  selector: 'app-home',
  imports: [NavbarComponent, TestimonialsComponent, FooterComponent, AboutComponent, ServicesComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {

}
