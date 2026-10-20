import { Router } from "express";

export const posts = Router();
const saved: { title: unknown; slug: unknown }[] = [];

posts.post("/posts", (req, res) => {
  const title = req.body.title;
  const post = { title, slug: title };
  saved.push(post);
  res.status(201).json(post);
});
