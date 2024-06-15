import { Injectable } from '@angular/core';
import { FormlyFieldConfig } from '@ngx-formly/core';

@Injectable({
    providedIn: 'root'
})
export class FormlyFieldService {

    getDefaultTextField(
        key: string,
        label: string,
        required: boolean,
        maxLength = 200
    ): FormlyFieldConfig {
        return {
            key,
            type: 'input',
            props: {
                label,
                required,
                maxLength
            }
        };
    }

    getDefaultDateField(
        key: string,
        label: string,
        required: boolean
    ): FormlyFieldConfig {
        return {
            key,
            type: 'datepicker',
            props: {
                label,
                required
            }
        };
    }

    getDefaultNumberField(
        key: string,
        label: string,
        required: boolean,
        disabled = false
    ): FormlyFieldConfig {
        return {
            key,
            type: 'number',
            props: {
                label,
                required,
                disabled: disabled ? true : false
            }
        };
    }

    getDefaultSelectField(
        key: string,
        label: string,
        required: boolean,
        options: { label: string, value: any }[],
        disabled = false
    ): FormlyFieldConfig {
        return {
            key,
            type: 'select',
            props: {
                label,
                required,
                options,
                disabled: disabled ? true : false
            }
        };
    }

    getDefaultMultiSelectField(
        key: string,
        label: string,
        required: boolean,
        options: { label: string, value: any }[]
    ): FormlyFieldConfig {
        return {
            key,
            type: 'select',
            props: {
                label,
                required,
                options,
                multiple: true
            }
        };
    }

    getDefaultCheckboxField(
        key: string,
        label: string,
    ): FormlyFieldConfig {
        return {
            key,
            type: 'checkbox',
            props: {
                label,
            }
        };
    }

}
