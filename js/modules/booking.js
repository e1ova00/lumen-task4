import {studioById} from '../data/studios.js';
export const STORAGE_KEY='lumen-studio.bookings.v1';
export const today=()=>localDate(new Date());
export function localDate(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
export function tomorrow(){const d=new Date();d.setDate(d.getDate()+1);return localDate(d);}
export function maxDate(){const d=new Date();d.setDate(d.getDate()+365);return localDate(d);}
export const money=n=>new Intl.NumberFormat('ru-RU').format(n)+' ₽';
export const hour=n=>String(n).padStart(2,'0')+':00';
export function validDate(s){if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;const d=new Date(s+'T12:00:00');return !isNaN(d)&&localDate(d)===s;}
export const overlaps=(a,b)=>a.date===b.date&&Number(a.start)<Number(b.start)+Number(b.duration)&&Number(b.start)<Number(a.start)+Number(a.duration);
export const occupied=(id,slot,bookings)=>bookings.some(b=>b.status==='active'&&b.studioId===id&&overlaps(b,slot));
export function validate(studio,slot,bookings=[],now=new Date()){
 const errors={};
 if(!validDate(slot.date))errors.date='Укажите существующую дату.';
 else if(slot.date<localDate(now)||slot.date>maxDate())errors.date='Выберите дату от сегодня до года вперёд.';
 if(slot.start===''||!Number.isInteger(Number(slot.start))||Number(slot.start)<8||Number(slot.start)>21)errors.start='Выберите начало с 08:00 до 21:00.';
 if(slot.duration===''||!Number.isInteger(Number(slot.duration))||Number(slot.duration)<1||Number(slot.duration)>14)errors.duration='Длительность — от 1 до 14 полных часов.';
 if(!errors.start&&!errors.duration&&Number(slot.start)+Number(slot.duration)>22)errors.duration='Съёмка должна завершиться до 22:00.';
 if(!errors.date&&!errors.start&&new Date(`${slot.date}T${hour(Number(slot.start))}:00`)<=now)errors.start='Это время уже прошло. Выберите более позднее.';
 if(!studio)errors.form='Студия не найдена.';
 else if(slot.guests===''||!Number.isInteger(Number(slot.guests))||Number(slot.guests)<1||Number(slot.guests)>studio.capacity)errors.guests=`Число гостей — от 1 до ${studio.capacity}.`;
 if(studio&&!errors.date&&!errors.start&&!errors.duration&&occupied(studio.id,slot,bookings))errors.form='Это время уже занято. Измените начало, длительность или дату.';
 return errors;
}
function validRecord(b){const s=b&&studioById(b.studioId);return s&&typeof b.id==='string'&&/^LS-[A-Z0-9-]{6,50}$/.test(b.id)&&validDate(b.date)&&Number.isInteger(b.start)&&b.start>=8&&b.start<=21&&Number.isInteger(b.duration)&&b.duration>=1&&b.start+b.duration<=22&&Number.isInteger(b.guests)&&b.guests>=1&&b.guests<=s.capacity&&b.total===s.price*b.duration&&['active','cancelled'].includes(b.status);}
export function readBookings(storage){
 try{storage ??= globalThis.localStorage;const raw=storage.getItem(STORAGE_KEY);if(!raw)return {bookings:[],warning:''};const data=JSON.parse(raw);if(!Array.isArray(data)||!data.every(validRecord)||new Set(data.map(b=>b.id)).size!==data.length)throw Error('invalid');return {bookings:data,warning:''};}
 catch{return {bookings:[],warning:'Не удалось прочитать сохранения. Проверьте доступ к localStorage. Повреждённые данные будут сохранены в резервной копии перед новой записью.'};}
}
function writeBookings(bookings,storage){const raw=storage.getItem(STORAGE_KEY);if(raw&&readBookings(storage).warning)storage.setItem(STORAGE_KEY+'.backup',raw);storage.setItem(STORAGE_KEY,JSON.stringify(bookings));}
async function exclusive(fn){if(globalThis.navigator?.locks)return navigator.locks.request('lumen-bookings',async()=>fn());return fn();}
export async function createBooking(studio,slot,storage){return exclusive(()=>{
 try{storage ??= globalThis.localStorage;}catch{return {errors:{form:'Хранилище браузера недоступно. Разрешите localStorage.'}};}
 const {bookings}=readBookings(storage);const errors=validate(studio,slot,bookings);if(Object.keys(errors).length)return {errors};
 const booking={id:'LS-'+crypto.randomUUID().toUpperCase(),studioId:studio.id,date:slot.date,start:Number(slot.start),duration:Number(slot.duration),guests:Number(slot.guests),total:studio.price*Number(slot.duration),status:'active'};
 try{writeBookings([...bookings,booking],storage);return {booking};}catch{return {errors:{form:'Браузер не разрешил сохранить бронь. Разрешите localStorage и попробуйте снова.'}};}
 });}
export async function cancelBooking(id,storage){return exclusive(()=>{storage ??= globalThis.localStorage;const {bookings,warning}=readBookings(storage);if(warning)throw Error('Сохранения недоступны. Отмена не выполнена.');const b=bookings.find(b=>b.id===id);if(!b||b.status!=='active')return;writeBookings(bookings.map(b=>b.id===id?{...b,status:'cancelled'}:b),storage);});}
