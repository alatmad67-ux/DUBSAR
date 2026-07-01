
"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, ShoppingCart, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  id: string;
  name: string;
  price: string;
  image: string;
  category: string;
  rating?: number;
  isNew?: boolean;
  inStock?: boolean;
}

export function ProductCard({ id, name, price, image, category, rating = 4.5, isNew, inStock = true }: ProductCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);

  return (
    <Card className="group relative overflow-hidden rounded-[24px] border-none bg-card shadow-sm hover:shadow-xl transition-all duration-500">
      <div className="relative aspect-square overflow-hidden bg-muted">
        <Link href={`/product/${id}`}>
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            data-ai-hint="motorcycle part"
          />
        </Link>
        
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {isNew && (
            <Badge className="bg-primary text-white border-none text-[10px] px-2 py-0.5 rounded-full">
              جديد
            </Badge>
          )}
          {!inStock && (
            <Badge variant="secondary" className="bg-destructive/10 text-destructive border-none text-[10px] px-2 py-0.5 rounded-full">
              نفذت الكمية
            </Badge>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3 rounded-full bg-white/80 backdrop-blur-sm border-none shadow-sm hover:bg-white"
          onClick={() => setIsFavorite(!isFavorite)}
        >
          <Heart className={cn("h-5 w-5 transition-colors", isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground")} />
        </Button>
      </div>

      <CardContent className="p-4 space-y-2">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
          <span>{category}</span>
          <div className="flex items-center gap-1 text-orange-400">
            <Star className="h-3 w-3 fill-current" />
            <span>{rating}</span>
          </div>
        </div>

        <Link href={`/product/${id}`}>
          <h3 className="font-bold text-sm line-clamp-2 leading-tight group-hover:text-primary transition-colors">
            {name}
          </h3>
        </Link>

        <div className="flex items-center justify-between pt-1">
          <div className="flex flex-col">
            <span className="text-lg font-black text-primary">{price}</span>
            <span className="text-[10px] text-muted-foreground">د.ع</span>
          </div>
          
          <Button size="icon" className="rounded-full h-10 w-10 shadow-md transform group-hover:translate-y-[-2px] transition-all">
            <ShoppingCart className="h-5 w-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
