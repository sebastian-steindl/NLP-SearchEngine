import { Injectable, EventEmitter } from '@angular/core';    
import { Subscription } from 'rxjs/internal/Subscription';    
    
@Injectable({    
  providedIn: 'root'    
})    
export class EventEmitterService {    
    
  invokeSearchStart = new EventEmitter();    
  subsVar: Subscription;    
    
  constructor() { }    
    
  onSearchStart() {    
    this.invokeSearchStart.emit();    
  }    
}    