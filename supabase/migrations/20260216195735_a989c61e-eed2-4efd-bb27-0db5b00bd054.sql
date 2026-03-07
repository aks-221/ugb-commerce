
CREATE OR REPLACE FUNCTION public.decrease_stock_on_order_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    UPDATE products p
    SET stock = GREATEST(p.stock - oi.quantity, 0),
        updated_at = now()
    FROM order_items oi
    WHERE oi.order_id = NEW.id
      AND p.id = oi.product_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_decrease_stock_on_completed
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.decrease_stock_on_order_completed();
