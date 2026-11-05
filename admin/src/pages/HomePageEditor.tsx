import PageEditor from "./PageEditor";
import { HOME_SECTIONS } from "../cms/homePage";

export default function HomePageEditor() {
  return (
    <PageEditor
      pageKey="home"
      title="Home page"
      icon="home"
      note="Every block of the front page, in the order the visitor meets it."
      fallback="Held back, the front page falls back to the words that ship with the site, so nothing disappears by accident."
      sections={ HOME_SECTIONS }
      sitePath="/"
    />
  );
}
