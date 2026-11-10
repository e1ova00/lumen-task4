let map,markers=new Map(),selectHandler,tileLayer,resizeObserver,tilesLoaded=0;
const fallback=message=>{const el=document.getElementById('map-notice');if(el){el.textContent=message;el.hidden=false;}};
export function initMap(onSelect){
 selectHandler=onSelect;if(map){map.invalidateSize();return;}
 if(!window.L){fallback('Карта недоступна: не загрузилась библиотека Leaflet. Выберите пространство в списке — бронирование работает.');return;}
 try{
 map=L.map('map',{scrollWheelZoom:false,zoomControl:false});L.control.zoom({position:'bottomright'}).addTo(map);
 tileLayer=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(map);
 tileLayer.on('tileerror',()=>{if(!tilesLoaded)fallback('Подложка карты недоступна. Метки и список работают; выберите студию, чтобы продолжить.');});
 tileLayer.on('tileload',()=>{tilesLoaded++;document.getElementById('map-notice').hidden=true;});
 resizeObserver=new ResizeObserver(()=>map?.invalidateSize());resizeObserver.observe(document.getElementById('map'));
 }catch{fallback('Карту не удалось открыть. Все студии доступны в списке.');}
}
export function updateMap(studios,selected,isOccupied,invalid=false){
 if(!map)return;
 markers.forEach(marker=>map.removeLayer(marker));markers.clear();
 studios.forEach(s=>{
 const busy=isOccupied(s.id),active=s.id===selected;
 const label=`${s.name} — ${invalid?'проверьте дату и время':busy?'занято':active?'выбрано':'доступно'}`;
 const icon=L.divIcon({className:'studio-marker',html:`<button class="map-pin ${busy?'busy':active?'chosen':''}" type="button" aria-label="${label}" aria-pressed="${active}" ${busy||invalid?'disabled':''}><span>${busy?'×':active?'✓':s.index}</span><b>${s.name}</b></button>`,iconSize:[44,44],iconAnchor:[22,22]});
 const marker=L.marker([s.lat,s.lng],{icon,keyboard:false,zIndexOffset:active?1000:0}).addTo(map);
 const button=marker.getElement().querySelector('button');button.addEventListener('click',()=>{if(!busy)selectHandler(s.id,'map');});markers.set(s.id,marker);
 });
}
export function fitMap(studios){if(map&&studios.length)map.fitBounds(studios.map(s=>[s.lat,s.lng]),{padding:[50,50],maxZoom:12});}
export function focusMarker(id){const marker=markers.get(id);if(marker&&map){map.panTo(marker.getLatLng(),{animate:!matchMedia('(prefers-reduced-motion: reduce)').matches});marker.getElement()?.querySelector('button')?.focus({preventScroll:true});}}
export function refreshMap(){map?.invalidateSize();}
export function cleanupMap(){resizeObserver?.disconnect();map?.remove();map=null;markers.clear();}
