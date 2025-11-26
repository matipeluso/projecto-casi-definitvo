import React from "react";
import {
  SUBDIMENSION_COMMENT_FIELDS,
  SUBDIMENSION_LOOKUP_BY_SLUG,
} from "./subdimensionCatalog";

const SECTION = SUBDIMENSION_LOOKUP_BY_SLUG["habilidades-comunicativas"];
const DEFAULT_ITEMS = SECTION?.items ?? [];
const OPTIONS = [1, 2, 3, 4, 0];

export default function HabilidadesComunicativas({
  values = [],
  comentarios = {},
  disabled = false,
  onValorChange,
  onComentarioChange,
}) {
  const items = values.length ? values : DEFAULT_ITEMS;
  return (
    <div className="container mb-4">
      <div className="border rounded p-4 bg-white">
        <h4 className="text-uppercase fw-bold mb-3">I. Habilidades comunicativas*</h4>
        <div className="table-responsive mb-4">
          <table className="table table-bordered table-sm align-middle">
            <thead className="table-light text-center">
              <tr>
                <th style={{ width: "40px" }}>N°</th>
                <th className="text-start">Descripción del ítem</th>
                <th>S<br /><small>(1)</small></th>
                <th>G<br /><small>(2)</small></th>
                <th>O<br /><small>(3)</small></th>
                <th>N<br /><small>(4)</small></th>
                <th>NO<br /><small>(0)</small></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                const name = `comunicacion_${item.numero || index + 1}`;
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
        <section className="row g-3">
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
        <small className="text-muted d-block mt-3">* Considere edad y curso de referencia.</small>
      </div>
    </div>
  );
}
