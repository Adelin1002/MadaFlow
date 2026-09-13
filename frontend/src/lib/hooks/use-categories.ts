import { useEffect, useState } from "react";
import { listCategories } from "@/lib/api/categories";
import type { Category } from "@/lib/api/types";

export function useCategories(): Category[] {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    listCategories()
      .then((response) => setCategories(response.results))
      .catch(() => {
        // Non bloquant : les pages qui l'utilisent restent utilisables sans
        // filtre/nom de catégorie, juste avec un UUID brut affiché en repli.
      });
  }, []);

  return categories;
}
