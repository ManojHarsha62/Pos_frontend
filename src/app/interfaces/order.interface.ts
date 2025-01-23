export interface Order {
  id: number;
  user_id: number;
  total_price: number;
  order_date: Date;
}

export interface OrderDetail {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price: number;
} 