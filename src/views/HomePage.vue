<template>
  <ion-page>

    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>📷 GalleryApp</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="currentView = 'gallery'" fill="clear">
            <ion-icon :icon="imagesOutline" slot="start" style="color:white;" />
            <span style="color: white; font-size: 13px; font-weight: 500;">My Photos</span>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content style="--background: #000;">

      <div v-if="currentView === 'camera'" style="height: 100%; display: flex; flex-direction: column;">

        <div style="flex: 1; background: #111; display: flex; align-items: center; justify-content: center; position: relative;">
          <video ref="videoEl" autoplay playsinline muted style="width: 100%; height: 100%; object-fit: cover;" />
          <div v-if="cameraError" style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; text-align: center; padding: 24px;">
            <ion-icon :icon="cameraOutline" style="font-size: 64px; color: #555; margin-bottom: 16px;" />
            <p style="color: #888; font-size: 14px;">{{ cameraError }}</p>
          </div>
          <canvas ref="canvasEl" style="display: none;" />
        </div>

        <div style="background: #000; padding: 24px 16px 36px; display: flex; align-items: center; justify-content: space-around;">

          <div style="display: flex; flex-direction: column; align-items: center; gap: 6px;" @click="pickFromGallery">
            <div style="width: 52px; height: 52px; border-radius: 10px; background: #222; display: flex; align-items: center; justify-content: center; cursor: pointer; border: 1.5px solid #444;">
              <img v-if="lastPhoto" :src="lastPhoto" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;" />
              <ion-icon v-else :icon="imagesOutline" style="font-size: 24px; color: #888;" />
            </div>
            <span style="font-size: 10px; color: #666;">Gallery</span>
          </div>

          <div @click="takePhoto" style="cursor: pointer;">
            <div style="width: 76px; height: 76px; border-radius: 50%; border: 4px solid white; display: flex; align-items: center; justify-content: center;">
              <div style="width: 62px; height: 62px; border-radius: 50%; background: white;" />
            </div>
          </div>

          <div style="display: flex; flex-direction: column; align-items: center; gap: 6px;" @click="flipCamera">
            <div style="width: 52px; height: 52px; border-radius: 50%; background: #222; display: flex; align-items: center; justify-content: center; cursor: pointer; border: 1.5px solid #444;">
              <ion-icon :icon="refreshOutline" style="font-size: 24px; color: #ccc;" />
            </div>
            <span style="font-size: 10px; color: #666;">Flip</span>
          </div>

        </div>

        <input ref="fileInput" type="file" accept="image/*" style="display: none;" @change="handleFileSelected" />

      </div>

      <div v-else-if="currentView === 'preview'" style="height: 100%; display: flex; flex-direction: column; background: #000;">

        <div style="flex: 1; display: flex; align-items: center; justify-content: center; background: #000;">
          <img :src="previewImage" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
        </div>

        <div style="background: #111; padding: 12px 16px;">
          <input
            v-model="captionInput"
            placeholder="Add a caption... (optional)"
            style="width: 100%; background: #222; border: none; border-radius: 8px; padding: 10px 14px; color: white; font-size: 14px; outline: none;"
          />
        </div>

        <div style="background: #000; padding: 16px 24px 36px; display: flex; gap: 12px;">
          <ion-button expand="block" fill="outline" color="light" style="flex: 1;" @click="discardPhoto">
            <ion-icon :icon="closeOutline" slot="start" />
            Retake
          </ion-button>
          <ion-button expand="block" color="primary" style="flex: 1;" @click="savePhoto" :disabled="saving">
            <ion-icon :icon="checkmarkOutline" slot="start" />
            {{ saving ? 'Saving...' : 'Save' }}
          </ion-button>
        </div>

      </div>

      <div v-else-if="currentView === 'gallery'" style="background: #000; min-height: 100%;">

        <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px;">
          <ion-button fill="clear" @click="currentView = 'camera'">
            <ion-icon :icon="cameraOutline" slot="start" style="color: white;" />
            <span style="color: white; font-size: 13px;">Camera</span>
          </ion-button>
          <span style="color: #888; font-size: 13px;">{{ photos.length }} photo{{ photos.length !== 1 ? 's' : '' }}</span>
        </div>

        <div v-if="loading" class="ion-text-center ion-padding">
          <ion-spinner name="crescent" color="light" />
          <p style="color: #666;">Loading...</p>
        </div>

        <div v-else-if="photos.length === 0" style="text-align: center; padding: 60px 24px;">
          <ion-icon :icon="imagesOutline" style="font-size: 64px; color: #333;" />
          <p style="color: #555; margin-top: 12px;">No photos yet</p>
          <ion-button fill="outline" color="light" @click="currentView = 'camera'" style="margin-top: 12px;">
            Take your first photo
          </ion-button>
        </div>

        <div v-else style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px;">
          <div
            v-for="photo in photos"
            :key="photo.id"
            style="aspect-ratio: 1; overflow: hidden; cursor: pointer; position: relative; background: #1a1a1a;"
            @click="openPhoto(photo)"
          >
            <img :src="photo.imageBase64" style="width: 100%; height: 100%; object-fit: cover;" :alt="photo.caption || 'Photo'" loading="lazy" />
          </div>
        </div>

      </div>

      <div v-else-if="currentView === 'fullscreen' && selectedPhoto" style="height: 100%; background: #000; display: flex; flex-direction: column;">

        <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: #000;">
          <ion-button fill="clear" @click="currentView = 'gallery'">
            <ion-icon :icon="arrowBackOutline" style="color: white;" slot="icon-only" />
          </ion-button>
          <span style="color: #888; font-size: 12px;">{{ selectedPhoto.date }}</span>
          <ion-button fill="clear" color="danger" @click="deletePhoto(selectedPhoto.id)">
            <ion-icon :icon="trashOutline" slot="icon-only" />
          </ion-button>
        </div>

        <div style="flex: 1; display: flex; align-items: center; justify-content: center;">
          <img :src="selectedPhoto.imageBase64" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
        </div>

        <div style="background: #111; padding: 16px;">
          <div v-if="!editingCaption" style="display: flex; align-items: center; justify-content: space-between;">
            <p style="color: white; font-size: 15px; margin: 0; flex: 1;">
              {{ selectedPhoto.caption || 'No caption' }}
            </p>
            <ion-button fill="clear" size="small" @click="startEditCaption">
              <ion-icon :icon="createOutline" style="color: #888;" slot="icon-only" />
            </ion-button>
          </div>
          <div v-else style="display: flex; gap: 8px; align-items: center;">
            <input
              v-model="captionEditInput"
              style="flex: 1; background: #222; border: none; border-radius: 8px; padding: 10px 12px; color: white; font-size: 14px; outline: none;"
              placeholder="Add a caption..."
              @keyup.enter="saveEditCaption"
            />
            <ion-button size="small" @click="saveEditCaption">Save</ion-button>
            <ion-button size="small" fill="clear" color="medium" @click="editingCaption = false">✕</ion-button>
          </div>
        </div>

      </div>

    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonButton, IonIcon, IonSpinner,
  alertController, toastController
} from '@ionic/vue';
import {
  cameraOutline, imagesOutline, refreshOutline,
  closeOutline, checkmarkOutline, arrowBackOutline,
  trashOutline, createOutline
} from 'ionicons/icons';

import { db } from '@/firebase';
import { ref as dbRef, push, onValue, update, remove } from 'firebase/database';

interface Photo {
  id: string;
  imageBase64: string;
  caption: string;
  date: string;
}

const currentView = ref<'camera' | 'preview' | 'gallery' | 'fullscreen'>('camera');
const photos = ref<Photo[]>([]);
const loading = ref(true);
const saving = ref(false);

const videoEl = ref<HTMLVideoElement | null>(null);
const canvasEl = ref<HTMLCanvasElement | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const cameraError = ref('');
const currentFacingMode = ref<'environment' | 'user'>('environment');
let stream: MediaStream | null = null;

const previewImage = ref('');
const captionInput = ref('');
const lastPhoto = ref('');
const selectedPhoto = ref<Photo | null>(null);
const editingCaption = ref(false);
const captionEditInput = ref('');

async function startCamera() {
  cameraError.value = '';
  try {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
    }
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: currentFacingMode.value },
      audio: false
    });
    if (videoEl.value) {
      videoEl.value.srcObject = stream;
    }
  } catch (err: any) {
    if (err.name === 'NotAllowedError') {
      cameraError.value = 'Camera permission denied. Please allow camera access and refresh.';
    } else if (err.name === 'NotFoundError') {
      cameraError.value = 'No camera found on this device.';
    } else {
      cameraError.value = 'Could not start camera. Try using the gallery button instead.';
    }
  }
}

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(t => t.stop());
    stream = null;
  }
}

async function flipCamera() {
  currentFacingMode.value = currentFacingMode.value === 'environment' ? 'user' : 'environment';
  await startCamera();
}

function takePhoto() {
  if (!videoEl.value || !canvasEl.value) return;
  const video = videoEl.value;
  const canvas = canvasEl.value;
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  previewImage.value = canvas.toDataURL('image/jpeg', 0.85);
  captionInput.value = '';
  stopCamera();
  currentView.value = 'preview';
}

function pickFromGallery() {
  fileInput.value?.click();
}

function handleFileSelected(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    previewImage.value = e.target?.result as string;
    captionInput.value = '';
    stopCamera();
    currentView.value = 'preview';
  };
  reader.readAsDataURL(file);
  (event.target as HTMLInputElement).value = '';
}

async function discardPhoto() {
  previewImage.value = '';
  captionInput.value = '';
  currentView.value = 'camera';
  await startCamera();
}

async function savePhoto() {
  if (!previewImage.value) return;
  saving.value = true;
  try {
    const photoData = {
      imageBase64: previewImage.value,
      caption: captionInput.value.trim(),
      date: new Date().toLocaleDateString('en-PH', {
        year: 'numeric', month: 'short', day: 'numeric'
      })
    };
    await push(dbRef(db, 'photos'), photoData);
    lastPhoto.value = previewImage.value;
    previewImage.value = '';
    captionInput.value = '';
    showToast('Photo saved!', 'success');
    currentView.value = 'camera';
    await startCamera();
  } catch (err) {
    showToast('Failed to save photo.', 'danger');
  } finally {
    saving.value = false;
  }
}

function openPhoto(photo: Photo) {
  selectedPhoto.value = photo;
  editingCaption.value = false;
  captionEditInput.value = photo.caption || '';
  stopCamera();
  currentView.value = 'fullscreen';
}

function startEditCaption() {
  captionEditInput.value = selectedPhoto.value?.caption || '';
  editingCaption.value = true;
}

async function saveEditCaption() {
  if (!selectedPhoto.value) return;
  await update(dbRef(db, `photos/${selectedPhoto.value.id}`), {
    caption: captionEditInput.value.trim()
  });
  selectedPhoto.value.caption = captionEditInput.value.trim();
  editingCaption.value = false;
  showToast('Caption saved!', 'success');
}

async function deletePhoto(id: string) {
  const alert = await alertController.create({
    header: 'Delete Photo',
    message: 'Are you sure?',
    buttons: [
      { text: 'Cancel', role: 'cancel' },
      {
        text: 'Delete',
        role: 'destructive',
        handler: async () => {
          await remove(dbRef(db, `photos/${id}`));
          currentView.value = 'gallery';
          showToast('Deleted.', 'danger');
        }
      }
    ]
  });
  await alert.present();
}

watch(currentView, async (newView, oldView) => {
  if (newView === 'camera') {
    await startCamera();
  } else if (oldView === 'camera' && newView !== 'preview') {
    stopCamera();
  }
});

onMounted(async () => {
  await startCamera();
  const photosRef = dbRef(db, 'photos');
  onValue(photosRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      photos.value = Object.entries(data)
        .map(([id, val]: [string, any]) => ({ id, ...val }))
        .reverse();
      lastPhoto.value = photos.value[0]?.imageBase64 || '';
    } else {
      photos.value = [];
      lastPhoto.value = '';
    }
    loading.value = false;
  });
});

onUnmounted(() => {
  stopCamera();
});

async function showToast(message: string, color: string) {
  const toast = await toastController.create({
    message, duration: 2000, color, position: 'bottom'
  });
  await toast.present();
}
</script>