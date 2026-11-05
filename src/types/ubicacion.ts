export interface Region{
    id:number;
    nombre:string;
}

export interface Ciudad{
    id:number;
    nombre:string;
    region:Region;
}