import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private readonly apiUrl = environment.apiUrl + '/api';

  constructor(private http: HttpClient) { }

  // Show prediction
  predictDrawing(base64Image: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/predict`, { image: base64Image });
  }

  // Get random words to draw
  getWords(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/round-words`);
  }

  //Scratch CNN Model Prediction
  predictDrawingScratch(base64Image: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/predict/scratch`, { image: base64Image });
  }
}
