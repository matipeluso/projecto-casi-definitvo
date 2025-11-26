import React from "react";
import { OBSERVACION_ITEMS_BY_CATEGORY } from "./observacionItems";

const SCALE = [
  "1 = siempre",
  "2 = generalmente",
  "3 = ocasionalmente",
  "4 = casi nunca",
  "0 = no observado",
];

function ObservationTable({ title, items, valores, onValorChange, disabled }) {
  return (
    <section className="mb-4">
      <h5 className="text-uppercase fw-bold mb-3">{title}</h5>
      <div className="table-responsive">
        <table className="table table-bordered align-middle">
          <thead className="table-light text-center">
            <tr>
              <th style={{ width: "40px" }}>N°</th>
              <th className="text-start">Descripción</th>
              {[1, 2, 3, 4, 0].map((valor) => (
                <th key={`${title}-head-${valor}`} style={{ width: "50px" }}>
                  {valor}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={`${item.categoria}-${item.item}`}>
                <td className="text-center fw-semibold">{item.item}</td>
                <td>{item.descripcion}</td>
                {[1, 2, 3, 4, 0].map((valor) => {
                  const checked = valores[item.item] === valor;
                  return (
                    <td key={`${item.item}-${valor}`} className="text-center">
                      <input
                        type="radio"
                        name={`obs-${item.item}`}
                        className="form-check-input"
                        value={valor}
                        checked={checked}
                        disabled={disabled}
                        onChange={() => onValorChange?.(item.item, valor)}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function ObservacionAmbienteEscolar({ valores = {}, onValorChange, disabled = false }) {
  return (
    <div className="bg-white py-4">
      <div className="container">
        <div className="border rounded p-4 shadow-sm">
          <header className="mb-4">
            <p className="text-uppercase small mb-1">Ley 20.201 – Decreto 170/2009</p>
            <h2 className="fw-bold text-uppercase mb-1">Evaluación Psicopedagógica y Curricular</h2>
            <p className="text-uppercase fw-semibold mb-3">Pauta de observación del estudiante en el ambiente escolar</p>
            <p>
              La presente pauta tiene como propósito recoger y comunicar las características del estudiante que se aprecian tanto en aula regular,
              aula de recursos (si corresponde) y en situaciones de recreo o actividades menos estructuradas. Escriba en cada casillero el número
              que corresponda, según la frecuencia en que se observa la conducta.
            </p>
            <div className="bg-light border rounded p-3">
              <div className="row g-2 text-center fw-semibold">
                {SCALE.map((texto) => (
                  <div className="col" key={texto}>
                    {texto}
                  </div>
                ))}
              </div>
            </div>
          </header>

          <ObservationTable
            title="Antecedentes académicos"
            items={OBSERVACION_ITEMS_BY_CATEGORY.academico}
            valores={valores}
            onValorChange={onValorChange}
            disabled={disabled}
          />

          <ObservationTable
            title="Antecedentes sociales y comunicativos"
            items={OBSERVACION_ITEMS_BY_CATEGORY.social}
            valores={valores}
            onValorChange={onValorChange}
            disabled={disabled}
          />

          <footer className="text-muted small text-center mt-4">
            Los datos de este documento son confidenciales; su divulgación o uso indebido será penado por la ley.
          </footer>
        </div>
      </div>
    </div>
  );
}
