import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, CheckCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { Skeleton } from "@/components/ui/Skeleton";

export function BuyCourseButton({ courseId, onSuccess, className }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [price, setPrice] = useState(null);

  useEffect(() => {
    setLoading(true);
    api.payments
      .getCoursePrice(courseId)
      .then((p) => setPrice(p))
      .catch(() => setPrice(null))
      .finally(() => setLoading(false));
  }, [courseId]);

  const handlePurchase = () => {
    navigate(`/app/premium?course_id=${courseId}`);
  };

  if (loading) {
    return <Skeleton className="h-10 w-full rounded-2xl" />;
  }

  if (!price) {
    return (
      <Button
        className={className}
        onClick={() => navigate("/app/premium")}
      >
        <Sparkles className="h-4 w-4 mr-1.5" />
        Unlock with Premium
      </Button>
    );
  }

  if (price.is_free) {
    return (
      <Button variant="secondary" className={className} disabled>
        <CheckCircle className="h-4 w-4 mr-1.5" />
        Free Course
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <Button className={className} onClick={handlePurchase}>
        <ShoppingCart className="h-4 w-4 mr-1.5" />
        Pay via UPI ₹{price.price}
      </Button>

      {price.original_price && price.original_price > price.price && (
        <div className="text-xs text-center">
          <span className="line-through text-ink-500">₹{price.original_price}</span>
          <span className="ml-2 text-emerald-400 font-bold">
            {price.discount_percentage}% OFF
          </span>
        </div>
      )}
    </div>
  );
}
