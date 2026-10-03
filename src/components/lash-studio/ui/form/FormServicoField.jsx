"use client";

import { useState } from "react";
import { Controller } from "react-hook-form";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { createFilterOptions } from "@mui/material/Autocomplete";
import { useAppData } from "../../../../context/AppDataProvider";
import { criarServico } from "../../../../actions/servicos";

/**
 * O campo de serviço, ligado ao catálogo da conta.
 *
 * O valor do formulário é o **id**, não o nome — é o id que vai para o banco, e
 * é ele que faz renomear um serviço propagar para todo o histórico.
 *
 * Digitar um nome que não existe oferece "Criar «...»" na própria lista. A
 * criação chama o servidor aqui mesmo, com estado de carregando local: é uma
 * ação pequena e isolada, que não precisa passar pelo provider nem bloquear os
 * botões do sheet.
 *
 * Só os serviços ativos aparecem para escolher — mas, se o registro aberto usa
 * um serviço desativado, ele continua na lista. Senão, editar um lançamento
 * antigo trocaria o serviço dele sem ninguém pedir.
 */

const filtrar = createFilterOptions();

export function FormServicoField({ control, name, rules, label, onAfterChange, ...props }) {
  const { servicos } = useAppData();
  const [criando, setCriando] = useState(false);

  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => {
        const selecionado = servicos.find((s) => s.id === field.value) ?? null;
        const opcoes = servicos.filter((s) => s.ativo || s.id === field.value);

        // `onAfterChange` recebe o anterior junto porque quem escuta costuma
        // querer comparar os dois (o sheet usa para sugerir o preço sem passar
        // por cima do que já estava no campo). Mesma ordem do FormSegmented:
        // primeiro o formulário, depois o aviso.
        function mudarPara(id) {
          const anterior = field.value;
          field.onChange(id);
          onAfterChange?.(id, anterior);
        }

        async function escolher(_, opcao) {
          if (!opcao) return mudarPara("");

          // Veio do "Criar «...»" ou de um Enter com texto livre.
          const nomeNovo = typeof opcao === "string" ? opcao : opcao.nomeNovo;
          if (nomeNovo) {
            setCriando(true);
            const r = await criarServico(nomeNovo);
            setCriando(false);
            if (r?.erro) return;
            return mudarPara(r.id);
          }

          mudarPara(opcao.id);
        }

        return (
          <Autocomplete
            value={selecionado}
            onChange={escolher}
            options={opcoes}
            loading={criando}
            disabled={criando}
            selectOnFocus
            handleHomeEndKeys
            freeSolo
            forcePopupIcon
            getOptionLabel={(o) => (typeof o === "string" ? o : o.rotulo ?? o.nome)}
            isOptionEqualToValue={(o, v) => o.id === v?.id}
            filterOptions={(opts, estado) => {
              const achadas = filtrar(opts, estado);
              const digitado = estado.inputValue.trim();
              const jaExiste = opts.some((o) => o.nome.toLowerCase() === digitado.toLowerCase());

              if (digitado && !jaExiste) {
                achadas.push({ id: `novo:${digitado}`, nomeNovo: digitado, rotulo: `Criar «${digitado}»` });
              }
              return achadas;
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                {...props}
                label={label}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
        );
      }}
    />
  );
}
