export function filterStudios(studios,{maxPrice='',minCapacity='',sort='index'}={}){
 const result=studios.filter(s=>(maxPrice===''||s.price<=Number(maxPrice))&&(minCapacity===''||s.capacity>=Number(minCapacity)));
 if(sort==='asc')result.sort((a,b)=>a.price-b.price);else if(sort==='desc')result.sort((a,b)=>b.price-a.price);
 return result;
}
