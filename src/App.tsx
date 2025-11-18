import { Starfield } from './Starfield';
import { ScrollSections } from "./ScrollSections";
import './App.css';

function App() {
  return (
    <>
      <div className="background" />
      <Starfield />
      <ScrollSections />  {/* вот тут */}
    </>
  );
}

export default App;
