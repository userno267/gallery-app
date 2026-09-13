<template>
  <ion-page>

    <!-- ── HEADER ── -->
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>📷 GalleryApp</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="chooseSource">
            <ion-icon :icon="addOutline" slot="icon-only" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>

      <!-- ── LOADING ── -->
      <div v-if="loading" class="ion-text-center ion-padding">
        <ion-spinner name="crescent" />
        <p>Loading photos...</p>
      </div>

      <!-- ── EMPTY STATE ── -->
      <div v-else-if="photos.length === 0" class="ion-text-center ion-padding" style="margin-top: 60px;">
        <ion-icon :icon="imagesOutline" style="font-size: 72px; color: #ccc;" />
        <h3 style="color: #999; margin-top: 12px;">No photos yet</h3>
        <p style="color: #bbb; font-size: 14px;">Tap the + button to add your first photo</p>
        <ion-button @click="chooseSource" style="margin-top: 16px;">
          <ion-icon :icon="cameraOutline" slot="start" />
          Add Photo
        </ion-button>
      </div>

      <!-- ── PHOTO GRID ── -->
      <div v-else style="padding: 4px;">

        <!-- Stats bar -->
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 12px;">
          <span style="font-size: 13px; color: gray;">{{ photos.length }} photo{{ photos.length !== 1 ? 's' : '' }}</span>
          <ion-button fill="clear" size="small" @click="chooseSource">
            <ion-icon :icon="addOutline" slot="start" />
            Add
          </ion-button>
        </div>

        <!-- Grid -->
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 3px;">
          <div
            v-for="photo in photos"
            :key="photo.id"
            style="aspect-ratio: 1; overflow: hidden; cursor: pointer; position: relative; background: #1a1a2e;"
            @click="openPhoto(photo)"
          >
            <img
              :src="photo.imageBase64"
              style="width: 100%; height: 100%; object-fit: cover;"
              :alt="photo.caption || 'Photo'"
            />
            <!-- Caption overlay if exists -->
            <div
              v-if="photo.caption"
              style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(transparent, rgba(0,0,0,0.7)); padding: 16px 6px 4px; color: white; font-size: 10px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"
            >
              {{ photo.caption }}
            </div>
          </div>
        </div>

      </div>

      <!-- ── FAB BUTTON ── -->
      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button @click="chooseSource" color="primary">
          <ion-icon :icon="cameraOutline" />
        </ion-fab-button>
      </ion-fab>

    </ion-content>

    <!-- ═══════════════════════════════════════════
         FULL SCREEN PHOTO MODAL
    ═══════════════════════════════════════════ -->
    <ion-modal :is-open="showDetail" @did-dismiss="closeDetail">
      <ion-header>
        <ion-toolbar color="dark">
          <ion-buttons slot="start">
            <ion-button @click="closeDetail" color="light">
              <ion-icon :icon="arrowBackOutline" slot="icon-only" />
            </ion-button>
          </ion-buttons>
          <ion-title color="light" style="font-size: 15px;">
            {{ selectedPhoto?.caption || 'Photo' }}
          </ion-title>
          <ion-buttons slot="end">
            <ion-button color="danger" @click="deletePhoto(selectedPhoto?.id)">
              <ion-icon :icon="trashOutline" slot="icon-only" />
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>

      <ion-content v-if="selectedPhoto" style="--background: #000;">

        <!-- Full size image -->
        <div style="display: flex; align-items: center; justify-content: center; min-height: 55vh; background: #000;">
          <img
            :src="selectedPhoto.imageBase64"
            style="max-width: 100%; max-height: 60vh; object-fit: contain;"
            :alt="selectedPhoto.caption || 'Photo'"
          />
        </div>

        <!-- Photo details -->
        <div style="background: #111; color: white; padding: 16px;">
          <p style="color: #aaa; font-size: 12px; margin: 0 0 8px;">📅 {{ selectedPhoto.date }}</p>

          <!-- Caption display / edit -->
          <div v-if="!editingCaption">
            <p style="font-size: 16px; margin: 0 0 12px; color: white;">
              {{ selectedPhoto.caption || 'No caption' }}
            </p>
            <ion-button fill="outline" color="light" size="small" @click="startEditCaption">
              <ion-icon :icon="createOutline" slot="start" />
              {{ selectedPhoto.caption ? 'Edit Caption' : 'Add Caption' }}
            </ion-button>
          </div>

          <!-- Caption edit form -->
          <div v-else style="margin-top: 8px;">
            <ion-item style="--background: #222; --color: white; border-radius: 8px; margin-bottom: 10px;">
              <ion-label position="stacked" style="color: #aaa;">Caption</ion-label>
              <ion-input v-model="captionInput" placeholder="Add a caption..." style="color: white;" />
            </ion-item>
            <div style="display: flex; gap: 8px;">
              <ion-button size="small" @click="saveCaption">Save</ion-button>
              <ion-button size="small" fill="outline" color="medium" @click="editingCaption = false">Cancel</ion-button>
            </div>
          </div>
        </div>

      </ion-content>
    </ion-modal>

  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonButton, IonIcon, IonSpinner,
  IonFab, IonFabButton, IonModal, IonItem, IonLabel, IonInput,
  actionSheetController, alertController, toastController
} from '@ionic/vue';
import {
  addOutline, cameraOutline, imagesOutline,
  arrowBackOutline, trashOutline, createOutline
} from 'ionicons/icons';

import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

import { db } from '@/firebase';
import {
  ref as dbRef,
  push,
  onValue,
  update,
  remove
} from 'firebase/database';

interface Photo {
  id: string;
  imageBase64: string;
  caption: string;
  date: string;
}

const photos = ref<Photo[]>([]);
const loading = ref(true);
const showDetail = ref(false);
const selectedPhoto = ref<Photo | null>(null);
const editingCaption = ref(false);
const captionInput = ref('');

onMounted(() => {
  const photosRef = dbRef(db, 'photos');
  onValue(photosRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      photos.value = Object.entries(data)
        .map(([id, val]: [string, any]) => ({ id, ...val }))
        .reverse(); // newest first
    } else {
      photos.value = [];
    }
    loading.value = false;
  });
});

async function chooseSource() {
  const actionSheet = await actionSheetController.create({
    header: 'Add Photo',
    buttons: [
      {
        text: 'Take Photo',
        icon: cameraOutline,
        handler: () => takePhoto(CameraSource.Camera)
      },
      {
        text: 'Choose from Gallery',
        icon: imagesOutline,
        handler: () => takePhoto(CameraSource.Photos)
      },
      {
        text: 'Cancel',
        role: 'cancel'
      }
    ]
  });
  await actionSheet.present();
}

async function takePhoto(source: CameraSource) {
  try {
    const image = await Camera.getPhoto({
      quality: 80,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: source
    });

    if (!image.dataUrl) return;

    // Ask for caption
    const alert = await alertController.create({
      header: 'Add a Caption',
      message: 'Optional — describe this photo',
      inputs: [
        {
          name: 'caption',
          type: 'text',
          placeholder: 'e.g. Sunset at the beach'
        }
      ],
      buttons: [
        {
          text: 'Skip',
          handler: async () => {
            await savePhoto(image.dataUrl!, '');
          }
        },
        {
          text: 'Save',
          handler: async (data) => {
            await savePhoto(image.dataUrl!, data.caption || '');
          }
        }
      ]
    });
    await alert.present();

  } catch (err: any) {
    // User cancelled — do nothing
    if (err?.message?.includes('cancelled') || err?.message?.includes('canceled')) return;
    showToast('Could not access camera. Check permissions.', 'danger');
  }
}

async function savePhoto(imageBase64: string, caption: string) {
  const photoData = {
    imageBase64,
    caption: caption.trim(),
    date: new Date().toLocaleDateString('en-PH', {
      year: 'numeric', month: 'short', day: 'numeric'
    })
  };

  await push(dbRef(db, 'photos'), photoData);
  showToast('Photo saved!', 'success');
}

function openPhoto(photo: Photo) {
  selectedPhoto.value = photo;
  editingCaption.value = false;
  captionInput.value = photo.caption || '';
  showDetail.value = true;
}

function closeDetail() {
  showDetail.value = false;
  selectedPhoto.value = null;
  editingCaption.value = false;
}

function startEditCaption() {
  captionInput.value = selectedPhoto.value?.caption || '';
  editingCaption.value = true;
}

async function saveCaption() {
  if (!selectedPhoto.value) return;
  await update(dbRef(db, `photos/${selectedPhoto.value.id}`), {
    caption: captionInput.value.trim()
  });
  selectedPhoto.value.caption = captionInput.value.trim();
  editingCaption.value = false;
  showToast('Caption updated!', 'success');
}

async function deletePhoto(id?: string) {
  if (!id) return;
  const alert = await alertController.create({
    header: 'Delete Photo',
    message: 'Are you sure you want to delete this photo?',
    buttons: [
      { text: 'Cancel', role: 'cancel' },
      {
        text: 'Delete',
        role: 'destructive',
        handler: async () => {
          await remove(dbRef(db, `photos/${id}`));
          closeDetail();
          showToast('Photo deleted.', 'danger');
        }
      }
    ]
  });
  await alert.present();
}

async function showToast(message: string, color: string) {
  const toast = await toastController.create({
    message,
    duration: 2000,
    color,
    position: 'bottom'
  });
  await toast.present();
}
</script>