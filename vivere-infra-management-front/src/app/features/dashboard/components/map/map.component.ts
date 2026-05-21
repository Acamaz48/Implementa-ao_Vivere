import { Component, AfterViewInit, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import * as L from 'leaflet';

const iconDefault = L.icon({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = iconDefault;

export interface MapMarker {
  lat: number;
  lng: number;
  title: string;
  info?: string;
}

@Component({
  selector: 'app-map',
  standalone: true,
  template: `<div id="main-map" style="height: 100%; min-height: 250px; border-radius: 8px;"></div>`,
})
export class MapComponent implements AfterViewInit, OnChanges {
  @Input() viewOnly: boolean = false;
  @Input() markers: MapMarker[] = [];
  @Output() locationSelected = new EventEmitter<{lat: number, lng: number}>();

  private map!: L.Map;
  private markersLayer = L.layerGroup();

  ngAfterViewInit(): void {
    this.map = L.map('main-map').setView([-23.5505, -46.6333], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);
    this.markersLayer.addTo(this.map);

    if (!this.viewOnly) {
      this.map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        this.map.eachLayer((layer) => {
          if (layer instanceof L.Marker && !this.viewOnly) this.map.removeLayer(layer);
        });
        L.marker([lat, lng]).addTo(this.map);
        this.locationSelected.emit({ lat, lng });
      });
    }

    this.renderMarkers();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['markers'] && this.map) {
      this.renderMarkers();
    }
  }

  private renderMarkers() {
    this.markersLayer.clearLayers();
    
    this.markers.forEach(m => {
      if (m.lat && m.lng) {
        const marker = L.marker([m.lat, m.lng]);
        
        if (m.info) {
          const tooltipContent = `
            <div style="font-family: 'Inter', sans-serif; padding: 5px;">
              <strong style="color: #ff6600; font-size: 14px; display: block; margin-bottom: 5px;">${m.title}</strong>
              <div style="color: #444; font-size: 12px; line-height: 1.4;">${m.info}</div>
            </div>
          `;
          marker.bindTooltip(tooltipContent, { direction: 'top', offset: [0, -35], opacity: 0.95 });
        }
        
        this.markersLayer.addLayer(marker);
      }
    });

    if (this.viewOnly && this.markers.length > 0) {
      const group = new L.FeatureGroup(this.markersLayer.getLayers() as L.Layer[]);
      this.map.fitBounds(group.getBounds(), { padding: [30, 30], maxZoom: 13 });
    }
  }
}