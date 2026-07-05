import { Component } from '@angular/core';
import { NavbarComponent } from "../navbar/navbar.component";
import { TestimonialsComponent } from '../testimonials/testimonials.component';
import { FooterComponent } from '../footer/footer.component';
import { RouterModule } from '@angular/router';
import { LandingComponent } from '../landing/landing.component';

@Component({
  selector: 'app-home',
  imports: [RouterModule, NavbarComponent, TestimonialsComponent, FooterComponent, LandingComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {

}
