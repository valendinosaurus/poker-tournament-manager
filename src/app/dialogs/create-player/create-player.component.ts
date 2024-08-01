import { Component, computed, inject, OnInit, signal, Signal, WritableSignal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Player } from '../../shared/interfaces/player.interface';
import { PlayerApiService } from '../../shared/services/api/player-api.service';
import { FetchService } from '../../shared/services/fetch.service';
import { take, tap } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { UserImageRoundComponent } from '../../shared/components/user-image-round/user-image-round.component';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
    selector: 'app-edit-player',
    templateUrl: './create-player.component.html',
    styleUrls: ['./create-player.component.scss'],
    standalone: true,
    imports: [
        FormsModule,
        UserImageRoundComponent,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
    ]
})
export class CreatePlayerComponent implements OnInit {

    private dialogRef: MatDialogRef<CreatePlayerComponent> = inject(MatDialogRef<CreatePlayerComponent>);
    private playerApiService: PlayerApiService = inject(PlayerApiService);
    private fetchService: FetchService = inject(FetchService);
    private http: HttpClient = inject(HttpClient);

    readonly WINDOW = window;

    data: {
        player: Player | null;
        blockName: boolean,
        external: boolean
    } = inject(MAT_DIALOG_DATA);

    model: {
        userImage: WritableSignal<string>;
        userImageCache: WritableSignal<string>;
        name: WritableSignal<string>;
        nameCache: WritableSignal<string>
        isValid: Signal<boolean>
    };

    ngOnInit(): void {
        this.model = {
            userImage: signal(this.data?.player?.image ?? ''),
            userImageCache: signal(this.data?.player?.image ?? ''),
            name: signal(this.data?.player?.name ?? ''),
            nameCache: signal(this.data?.player?.name ?? ''),
            isValid: computed(() =>
                !(this.model.nameCache() === this.model.name()
                    && this.model.userImageCache() === this.model.userImage())
                && this.model.name().length > 0
            )
        };
    }

    onSubmit(): void {
        if (this.data?.player) {
            if (this.data?.external) {
                this.playerApiService.putAndKeepSub$({
                    ...this.data.player,
                    name: this.model.name(),
                    image: this.model.userImage()
                }).pipe(
                    take(1),
                    tap(() => {
                        this.fetchService.trigger();
                        this.dialogRef.close(true);
                    })
                ).subscribe();
            } else {
                this.playerApiService.put$({
                    ...this.data.player,
                    name: this.model.name(),
                    image: this.model.userImage()
                }).pipe(
                    take(1),
                    tap(() => {
                        this.fetchService.trigger();
                        this.dialogRef.close(true);
                    })
                ).subscribe();
            }
        } else {
            this.playerApiService.post$({
                name: this.model.name(),
                image: this.model.userImage(),
                locked: false,
                id: -1
            }).pipe(
                take(1),
                tap(() => {
                    this.fetchService.trigger();
                    this.dialogRef.close(true);
                })
            ).subscribe();
        }
    }

    closeDialog(event: Event): void {
        event.preventDefault();
        this.dialogRef.close(false);
    }

    previewImage: any;
    fileName!: string;
    file: any;

    onFileSelected(event: any): void {
        if (event.target.files[0]) {
            this.fileName = event.target.files[0].name;
            this.file = event.target.files[0];
            const formData = new FormData();
            formData.append('file', this.file);

            const headers = new HttpHeaders({'enctype': 'multipart/form-data'});

            this.http.post<string>(
                'https://img.poker.rugolo.ch/images/uploadImage.php',
                formData,
                {
                    headers: headers,
                    responseType: 'text' as 'json'
                }
            ).pipe(
                take(1),
                tap((res) => this.model.userImage.set(`https://img.poker.rugolo.ch/images/${res}`))
            ).subscribe();
        }
    }

    // onFileSelected(event: any): void {
    //     if (event.target.files[0]) {
    //         if (event.target.files[0].size < 1000000) {
    //             this.previewImage = URL.createObjectURL(event.target.files[0]);
    //             localStorage.setItem('preview', this.previewImage);
    //         }
    //         this.resizeImage(event.target.files[0]);
    //     }
    // }
    //
    // resizeImage(file: File) {
    //     // if (file.size < 1000000) {
    //     //     const reader = new FileReader();
    //     //     reader.onload = () => {
    //     //         //       this.model.image = reader.result;
    //     //
    //     // //        this.upl
    //     //     };
    //     //
    //     //     reader.readAsDataURL(file);
    //     // } else {
    //     //     const canvas = document.createElement('canvas');
    //     //     const context = canvas.getContext('2d');
    //     //     const maxW = 700;
    //     //     const maxH = 700;
    //     //     const img = document.createElement('img');
    //     //
    //     //     img.onload = () => {
    //     //         const iw = img.width;
    //     //         const ih = img.height;
    //     //         const scale = Math.min((maxW / iw), (maxH / ih));
    //     //         const iwScaled = iw * scale;
    //     //         const ihScaled = ih * scale;
    //     //         canvas.width = iwScaled;
    //     //         canvas.height = ihScaled;
    //     //         context?.drawImage(img, 0, 0, iwScaled, ihScaled);
    //     //         //      this.model.image = canvas.toDataURL(undefined, 0.8);
    //     //         ///    localStorage.setItem('image', this.model.image);
    //     //
    //     //         this.resizeImage(this.dataURLtoFile(canvas.toDataURL(undefined, 0.8), file.name));
    //     //     };
    //     //     img.src = URL.createObjectURL(file);
    //     //
    //     //     console.log('set THERE');
    //     //     this.previewImage = img.src;
    //     //     localStorage.setItem('preview', this.previewImage);
    //     // }
    //
    //     //  const file:File = event.target.files[0];
    //
    //     if (file) {
    //
    //         //  this.fileName = file.name;
    //
    //         const formData = new FormData();
    //
    //         formData.append('userImage', file);
    //
    //         // return this.authUtilService.getSub$().pipe(
    //         //     switchMap((sub: string) => this.http.get<AdminSeries[]>(
    //         //         `${BACKEND_URL}${this.ENDPOINT}/admin/${sub}`
    //         //     ))
    //         // );
    //
    //         const upload$ = this.http.post(
    //             `${BACKEND_URL}user/image`,
    //             formData
    //         );
    //
    //         upload$.pipe(
    //             tap(e => console.log(e))
    //         ).subscribe();
    //     }
    //
    // }

    private dataURLtoFile(dataUrl: any, filename: string) {
        const arr = dataUrl.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const byteString = atob(arr[1]);
        let n = byteString.length;
        const u8arr = new Uint8Array(n);

        while (n--) {
            u8arr[n] = byteString.charCodeAt(n);
        }
        return new File([u8arr], filename, {type: mime});
    }

}
