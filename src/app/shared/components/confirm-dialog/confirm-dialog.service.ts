import { Injectable, ApplicationRef, createComponent, EnvironmentInjector, ComponentRef } from '@angular/core';
import { ConfirmDialogComponent } from './confirm-dialog.component';

export interface ConfirmDialogConfig {
    title: string;
    message: string;
    variant?: 'danger' | 'warning' | 'info';
    confirmText?: string;
    cancelText?: string;
}

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
    constructor(
        private appRef: ApplicationRef,
        private envInjector: EnvironmentInjector
    ) { }

    confirm(config: ConfirmDialogConfig): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            const componentRef: ComponentRef<ConfirmDialogComponent> = createComponent(ConfirmDialogComponent, {
                environmentInjector: this.envInjector
            });

            const instance = componentRef.instance;
            instance.title = config.title;
            instance.message = config.message;
            instance.variant = config.variant || 'danger';
            instance.confirmText = config.confirmText || 'Confirmar';
            instance.cancelText = config.cancelText || 'Cancelar';

            instance.confirmed.subscribe(() => {
                this.destroyDialog(componentRef);
                resolve(true);
            });

            instance.cancelled.subscribe(() => {
                this.destroyDialog(componentRef);
                resolve(false);
            });

            this.appRef.attachView(componentRef.hostView);
            document.body.appendChild(componentRef.location.nativeElement);
        });
    }

    private destroyDialog(componentRef: ComponentRef<ConfirmDialogComponent>) {
        this.appRef.detachView(componentRef.hostView);
        componentRef.destroy();
    }
}
