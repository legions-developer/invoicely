import { HeadingTwo, HeadingThree, Paragraph } from "./headings";
import { UnorderedList, OrderedList } from "./points";
import { MDXLink } from "./link";
import MDXImage from "./image";
import { Code } from "./code";

export const blogComponents = {
  img: MDXImage,
  a: MDXLink,
  pre: Code,
  h1: HeadingTwo,
  h2: HeadingTwo,
  h3: HeadingThree,
  h4: HeadingThree,
  h5: HeadingThree,
  p: Paragraph,
  ul: UnorderedList,
  ol: OrderedList,
};
