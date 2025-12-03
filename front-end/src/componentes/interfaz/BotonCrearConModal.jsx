// src/componentes/interfaz/BotonCrearConModal.jsx
import React, { useMemo, useState } from 'react';

export default function BotonCrearConModal({
  textoBoton = 'Agregar',
  icono = 'bi-plus-lg',
  className = 'btn btn-primary',
  titulo = 'Nuevo registro',
  tamanoModal = 'modal-lg',
  campos = [],
  valoresIniciales = {},
  transformarValores,
  onGuardar,
  onExito,
}) {
  const [mostrar, setMostrar] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState('');
  const [valores, setValores] = useState({ ...valoresIniciales });

  const requeridos = useMemo(
    () => campos.filter((c) => c.required).map((c) => c.name),
    [campos]
  );

  function abrir() {
    setErrorForm('');
    // ✅ Normalizamos SOLO al abrir:
    // si algún valor inicial es 1/"1" y el campo NO es numérico, lo dejamos '' para que se vea el placeholder.
    const sane = {};
    campos.forEach((c) => {
      const v = valoresIniciales[c.name];
      sane[c.name] =
        (c.type !== 'number' && (v === 1 || v === '1'))
          ? ''
          : (v ?? '');
    });
    setValores(sane);
    setMostrar(true);
  }

  function cerrar() {
    setMostrar(false);
  }

  function onChange(e) {
    const { name, value } = e.target;
    setValores((prev) => ({ ...prev, [name]: value }));
  }

  function validarObligatorios() {
    for (const name of requeridos) {
      const valor = valores[name];
      if (valor === undefined || valor === null || String(valor).trim() === '') {
        const campo = campos.find((c) => c.name === name);
        const etiqueta = campo?.label || name;
        return `El campo "${etiqueta}" es obligatorio.`;
      }
    }
    return '';
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErrorForm('');

    const msg = validarObligatorios();
    if (msg) {
      setErrorForm(msg);
      return;
    }

    // Construye payload básico según type y omite vacíos
    const base = {};
    campos.forEach((c) => {
      const bruto = valores[c.name];
      if (bruto === '' || bruto === undefined || bruto === null) {
        return;
      }
      if (c.type === 'number') {
        const num = Number(bruto);
        if (!Number.isNaN(num)) base[c.name] = num;
      } else {
        base[c.name] = bruto;
      }
    });

    const payload = transformarValores ? transformarValores({ ...valores, ...base }) : base;

    try {
      setGuardando(true);
      const res = await onGuardar(payload);
      cerrar();
      if (typeof onExito === 'function') onExito(res);
    } catch (err) {
      const detalle = err?.response?.data;
      const mensaje =
        detalle
          ? (typeof detalle === 'string' ? detalle : JSON.stringify(detalle))
          : (err?.message || 'Ocurrió un error al guardar. Intente nuevamente.');
      setErrorForm(mensaje);
    } finally {
      setGuardando(false);
    }
  }

  function renderCampo(c) {
    const common = {
      name: c.name,
      value: valores[c.name] ?? '', // 🔙 volvemos a usar el valor tal cual el usuario escribe
      onChange,
      placeholder: c.placeholder || '',
      required: Boolean(c.required),
      disabled: Boolean(c.disabled),
      ...(c.attrs || {}),
    };

    return c.type === 'select' ? (
      <select {...common} className="form-select">
        <option value="">Seleccione…</option>
        {(c.options || []).map((opt) =>
          typeof opt === 'string' ? (
            <option key={opt} value={opt}>{opt}</option>
          ) : (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          )
        )}
      </select>
    ) : c.type === 'textarea' ? (
      <textarea {...common} className="form-control" rows={3} />
    ) : c.type === 'number' ? (
      <input type="number" inputMode="numeric" {...common} className="form-control" />
    ) : c.type === 'date' ? (
      <input type="date" {...common} className="form-control" />
    ) : c.type === 'tel' ? (
      <input type="tel" {...common} className="form-control" />
    ) : c.type === 'email' ? (
      <input type="email" {...common} className="form-control" />
    ) : (
      <input type="text" {...common} className="form-control" />
    );
  }

  return (
    <>
      <button type="button" className={className} onClick={abrir}>
        <i className={`bi ${icono} me-1`} aria-hidden="true"></i>
        {textoBoton}
      </button>

      {mostrar ? (
        <>
          <div
            className="modal fade show"
            role="dialog"
            aria-labelledby="modalCrearGenericoLabel"
            aria-modal="true"
            style={{ display: 'block' }}
          >
            <div className={`modal-dialog ${tamanoModal} modal-dialog-centered`}>
              <div className="modal-content">
                <div className="modal-header">
                  <h5 id="modalCrearGenericoLabel" className="modal-title">{titulo}</h5>
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Cerrar"
                    onClick={guardando ? undefined : cerrar}
                    disabled={guardando}
                  ></button>
                </div>

                <form onSubmit={onSubmit}>
                  <div className="modal-body">
                    {errorForm ? (
                      <div className="alert alert-danger" role="alert">{errorForm}</div>
                    ) : null}

                    <div className="row g-3">
                      {campos.map((c) => (
                        <div key={c.name} className={c.col || 'col-md-6'}>
                          <label className="form-label">
                            {c.label} {c.required ? <span className="text-danger">*</span> : null}
                          </label>
                          {renderCampo(c)}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={guardando ? undefined : cerrar}
                      disabled={guardando}
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={guardando}>
                      {guardando ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Guardando…
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check2 me-1" aria-hidden="true"></i>
                          Guardar
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      ) : null}
    </>
  );
}