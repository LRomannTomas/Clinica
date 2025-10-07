import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-quick-login',
  standalone: true,
  templateUrl: './quick-login.html'
})
export class QuickLogin {
  @Output() pick = new EventEmitter<'admin'|'especialista'|'paciente'>();
  select(role: 'admin'|'especialista'|'paciente') { this.pick.emit(role); }
}
