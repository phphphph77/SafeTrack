import { createContext, useContext, useState, useEffect } from 'react';


const AcessibilidadeContext = createContext({});


export function AcessibilidadeProvider({ children }) {
  const [tema, setTema] = useState(
    () => localStorage.getItem('hse_tema') || 'normal'
  );
  const [fonteGrande, setFonteGrande] = useState(
    () => localStorage.getItem('hse_fonte') === 'true'
  );


  useEffect(() => {
    const root = document.documentElement;

    // Remove todos os temas anteriores
    root.classList.remove(
      'tema-daltonico',
      'tema-deuteranopia',
      'tema-protanopia',
      'tema-tritanopia',
      'tema-acromato',
      'tema-alto-contraste'
    );

    // Mapeia o id do tema para a classe CSS
    const classeMap = {
      'alto-contraste':         'tema-alto-contraste',
      'daltonico-deuteranopia': 'tema-deuteranopia',
      'daltonico-protanopia':   'tema-protanopia',
      'daltonico-tritanopia':   'tema-tritanopia',
      'daltonico-acromato':     'tema-acromato',
    };

    if (classeMap[tema]) {
      root.classList.add(classeMap[tema]);
    }

    localStorage.setItem('hse_tema', tema);
  }, [tema]);


  useEffect(() => {
    const root = document.documentElement;
    if (fonteGrande) {
      root.classList.add('fonte-grande');
    } else {
      root.classList.remove('fonte-grande');
    }
    localStorage.setItem('hse_fonte', fonteGrande);
  }, [fonteGrande]);


  return (
    <AcessibilidadeContext.Provider value={{ tema, setTema, fonteGrande, setFonteGrande }}>
      {children}
    </AcessibilidadeContext.Provider>
  );
}


export const useAcessibilidade = () => useContext(AcessibilidadeContext);