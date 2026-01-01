import bookCover1 from "@/assets/book-cover-1.jpg";
import bookCover2 from "@/assets/book-cover-2.jpg";
import bookCover3 from "@/assets/book-cover-3.jpg";
import bookCover4 from "@/assets/book-cover-4.jpg";
import bookCover5 from "@/assets/book-cover-5.jpg";
import bookCover6 from "@/assets/book-cover-6.jpg";
import { Book } from "@/components/BookCard";

export const sampleBooks: Book[] = [
  {
    id: "1",
    title: "Ihlathi Lomlilo",
    author: "Sipho Mthethwa",
    coverUrl: bookCover1,
    rating: 4.8,
    duration: "5h 32m",
    price: 149,
    category: "Folk Tales",
    description: "A mystical journey through the enchanted forests of KwaZulu-Natal, where ancient spirits guide a young hero on a quest for truth.",
  },
  {
    id: "2",
    title: "Inkosi Yezilwane",
    author: "Nomvula Dlamini",
    coverUrl: bookCover2,
    rating: 4.6,
    duration: "7h 15m",
    price: 199,
    category: "Adventure",
    description: "Follow the epic adventure of a young Zulu warrior as he embarks on a journey across the African savanna to save his kingdom.",
  },
  {
    id: "3",
    title: "Uthando Olungapheli",
    author: "Thandi Nkosi",
    coverUrl: bookCover3,
    rating: 4.9,
    duration: "6h 45m",
    price: 129,
    category: "Romance",
    description: "A timeless love story set against the backdrop of rural KwaZulu-Natal, where two hearts find each other against all odds.",
  },
  {
    id: "4",
    title: "Izilwane Zasemhlabeni",
    author: "Bheki Zulu",
    coverUrl: bookCover4,
    rating: 4.7,
    duration: "2h 30m",
    price: 89,
    category: "Children",
    description: "Delightful stories for children featuring the beloved animals of Africa, teaching valuable lessons about friendship and courage.",
  },
  {
    id: "5",
    title: "Isimangaliso Sobusuku",
    author: "Lindiwe Khumalo",
    coverUrl: bookCover5,
    rating: 4.5,
    duration: "8h 10m",
    price: 179,
    category: "Mystery",
    description: "A gripping mystery thriller set in a remote village, where secrets from the past threaten to destroy the present.",
  },
  {
    id: "6",
    title: "Amakhosi Akudala",
    author: "Mandla Shabalala",
    coverUrl: bookCover6,
    rating: 4.8,
    duration: "10h 20m",
    price: 249,
    category: "Historical",
    description: "An epic historical saga chronicling the rise and fall of the great Zulu kingdoms, brought to life through masterful storytelling.",
  },
];

export const categories = [
  "All",
  "Folk Tales",
  "Adventure", 
  "Romance",
  "Children",
  "Mystery",
  "Historical",
];
