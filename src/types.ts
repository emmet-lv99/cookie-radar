export interface StoreData {
    id?: string;
    name: string;
    address?: string; // data.json 호환용
    roadAddress?: string;
    jibunAddress?: string;
    menuInfo: string[];
    lat?: number;
    lng?: number;
}
