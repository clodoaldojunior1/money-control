"use client";
import { useState, useContext } from 'react';
import { CaixaContext } from '../context/CaixaContext';

export default function TelaInicial() {
  // Pescamos os dados direto da nuvem do contexto
  const { faturamento, adicionarFaturamento } = useContext(CaixaContext);
  const [inputValor, setInputValor] = useState('');

  const handleSalvar = () => {
    if (!inputValor) return;
    adicionarFaturamento(inputValor);
    setInputValor(''); // Limpa o campo após salvar
  };

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Faturamento de Hoje: R$ {faturamento}</h1>
      
      <input 
        type="number" 
        placeholder="Valor do procedimento" 
        value={inputValor}
        onChange={(e) => setInputValor(e.target.value)}
      />
      
      <button onClick={handleSalvar}>
        Lançar no Caixa
      </button>
    </div>
  );
}