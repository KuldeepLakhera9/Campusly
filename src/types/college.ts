export interface ICollege {
  id?: string;
  _id?: string;
  name: string;
  domain: string;
  city: string;
  state: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
