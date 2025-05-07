import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FirebaseConfig {
  private mainData: any;

  setRemoteConfig(data: any) {
    this.mainData = data;
  }

  getRemoteConfig() {
    return this.mainData;
  }
}
