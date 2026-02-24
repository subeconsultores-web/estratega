import { Injectable, ComponentRef, ViewContainerRef, Type, ENVIRONMENT_INITIALIZER, inject } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class DynamicUiRendererService {

    private componentRefs: ComponentRef<any>[] = [];

    constructor() { }

    /**
     * Instancia dinámicamente un componente dentro de un contenedor especificado
     * @param container El ViewContainerRef (ej. un ng-template o div marcado con #container)
     * @param componentType La clase del componente a instanciar
     * @param data Payload opcional para inyectar en el @Input del componente
     */
    renderComponent<T>(container: ViewContainerRef, componentType: Type<T>, data?: any): ComponentRef<T> {
        const componentRef = container.createComponent(componentType);

        // Si pasamos data, iteramos para setear los @Inputs del componente instanciado
        if (data) {
            Object.keys(data).forEach(key => {
                componentRef.setInput(key, data[key]);
            });
        }

        // Guardamos la referencia para poder limpiar memoria después
        this.componentRefs.push(componentRef);
        return componentRef;
    }

    /**
     * Limpia todos los componentes generados dinámicamente y libera memoria
     */
    clearAll(container: ViewContainerRef) {
        container.clear();
        this.componentRefs.forEach(ref => ref.destroy());
        this.componentRefs = [];
    }
}
