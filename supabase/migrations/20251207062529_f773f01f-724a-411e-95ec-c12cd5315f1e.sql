-- Create notifications table
CREATE TABLE public.notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info',
    is_read BOOLEAN NOT NULL DEFAULT false,
    reference_id UUID,
    reference_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Allow authenticated admins to view all notifications
CREATE POLICY "Admins can view notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update notifications (mark as read)
CREATE POLICY "Admins can update notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete notifications
CREATE POLICY "Admins can delete notifications"
ON public.notifications
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow system to insert notifications (via triggers)
CREATE POLICY "System can insert notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create trigger function to create notification on new inquiry
CREATE OR REPLACE FUNCTION public.notify_new_inquiry()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.notifications (title, message, type, reference_id, reference_type)
    VALUES (
        'New Stall Inquiry',
        'New inquiry from ' || NEW.name || ' for stall ' || NEW.stall_id,
        'inquiry',
        NEW.id,
        'inquiry'
    );
    RETURN NEW;
END;
$$;

-- Create trigger on inquiries table
CREATE TRIGGER on_new_inquiry
AFTER INSERT ON public.inquiries
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_inquiry();