import React from "react";
import {
  SUBDIMENSION_COMMENT_FIELDS,
  SUBDIMENSION_LOOKUP_BY_SLUG,
} from "../../componentes/psicopedagogica/subdimensionCatalog";

const SECTION = SUBDIMENSION_LOOKUP_BY_SLUG["habilidades-sociales-afectividad"];
const DEFAULT_ITEMS = SECTION?.items ?? [];
const OPTIONS = [1, 2, 3, 4, 0];

export default function HabilidadesSociales({
  values = [],
  comentarios = {},
  disabled = false,
  onValorChange,
  onComentarioChange,
}) {
  const items = values.length ? values : DEFAULT_ITEMS;
  return (
    <div className="bg-white py-4">
      <div className="container">
        <div className="border rounded p-4 shadow-sm">
          <header className="text-center mb-4">
            <p className="text-uppercase small mb-1">Ley 20.201 – Decreto 170/2009</p>
            <h2 className="fw-bold text-uppercase mb-1">
              Evaluación Psicopedagógica y Curricular
            </h2>
            <p className="fw-semibold text-uppercase small">
              II.- Habilidades Sociales y Afectividad (Detección de NEE)
            </p>
          </header>

          <section className="mb-3">
            <div className="bg-warning px-3 py-2 rounded-top fw-semibold text-uppercase">
              Escala de observación
            </div>
            <div className="border border-top-0 rounded-bottom p-3 bg-light">
              <div className="row text-center fw-semibold">
                <div className="col">1 = siempre</div>
                <div className="col">2 = generalmente</div>
                <div className="col">3 = ocasionalmente</div>
                <div className="col">4 = casi nunca</div>
                <div className="col">0 = no observado</div>
              </div>
            </div>
          </section>

          <div className="table-responsive mb-4">
            <table className="table table-bordered table-sm align-middle">
              <thead className="table-light text-center">
                <tr>
                  <th style={{ width: "40px" }}>N°</th>
                  <th className="text-start">Descripción</th>
                  <th>S<br /><small>(1)</small></th>
                  <th>G<br /><small>(2)</small></th>
                  <th>O<br /><small>(3)</small></th>
                  <th>N<br /><small>(4)</small></th>
                  <th>NO<br /><small>(0)</small></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => {
                  const name = `social_${item.numero || index + 1}`;
                  return (
                    <tr key={name}>
                      <td className="text-center fw-bold">{item.numero || index + 1}</td>
                      <td>{item.descripcion || item}</td>
                      {OPTIONS.map((valor) => {
                        const numericValue = Number(valor);
                        const checked = Number(item.valor) === numericValue;
                        return (
                          <td key={`${name}-${valor}`} className="text-center">
                            <input
                              type="radio"
                              name={name}
                              value={numericValue}
                              className="form-check-input"
                              checked={checked}
                              onChange={() => onValorChange?.(index, numericValue)}
                              disabled={disabled}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <section className="row g-3 mb-4">
            {SUBDIMENSION_COMMENT_FIELDS.map(({ field, label, rows }) => (
              <div className="col-12" key={field}>
                <label className="form-label">{label}</label>
                <textarea
                  className="form-control"
                  rows={rows}
                  value={comentarios?.[field] || ""}
                  onChange={(event) => onComentarioChange?.(field, event.target.value)}
                  disabled={disabled}
                />
              </div>
            ))}
          </section>

          <footer className="text-muted small">
            * Considere edad y curso de referencia. Los datos de este documento son confidenciales; su divulgación o uso indebido será penado por la ley.
          </footer>
        </div>
      </div>
    </div>
  );
}
