import { bootstrapApplication } from '@angular/platform-browser';
import {
  RouteReuseStrategy,
  provideRouter,
  withPreloading,
  PreloadAllModules,
} from '@angular/router';
import {
  IonicRouteStrategy,
  provideIonicAngular,
} from '@ionic/angular/standalone';
import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { importProvidersFrom } from '@angular/core';
import { IonicStorageModule } from '@ionic/storage-angular';
import { initializeApp } from 'firebase/app';
import {
  getRemoteConfig,
  fetchAndActivate,
  getValue,
} from 'firebase/remote-config';
import { APP_INITIALIZER } from '@angular/core';
import { FirebaseConfig } from './app/firebase.component';

const firebaseConfig = {
  apiKey: 'AIzaSyCnbWoX3at3lfIyEqui2eamQeblJ8QFST4',
  authDomain: 'list-to-do-tasks.firebaseapp.com',
  projectId: 'list-to-do-tasks',

  storageBucket: 'list-to-do-tasks.firebasestorage.app',
  messagingSenderId: 'SENDER_ID',
  appId: '1:633473829957:android:f2503e707bbd9e89f8272c',
};

const app = initializeApp(firebaseConfig);

const remoteConfig = getRemoteConfig(app);

remoteConfig.settings.minimumFetchIntervalMillis = 0;

remoteConfig.defaultConfig = {
  welcome_message: 'Welcome',
};

function initializeConfig(firebaseConfig: FirebaseConfig) {
  return async () => {
    await initializeRemoteConfig(firebaseConfig);
  };
}

export async function initializeRemoteConfig(firebaseConfig: FirebaseConfig) {
  try {
    const fetchResult = await fetchAndActivate(remoteConfig);

    if (fetchResult) {
      console.log('Configuración remota cargada y activada con éxito');
    } else {
      console.log('No se activaron nuevos valores remotos');
    }
    firebaseConfig.setRemoteConfig(remoteConfig);
    console.log(getValue(remoteConfig, 'welcome_message'));
  } catch (error) {
    console.error('Error al inicializar Remote Config:', error);
  }
}

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    importProvidersFrom(IonicStorageModule.forRoot()),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeConfig,
      deps: [FirebaseConfig],
      multi: true,
    },
  ],
});
