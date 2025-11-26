import React, { useState } from "react";
import { postEquipoAula } from "../../../servicios/apiPie";

const docenteColumns = [
  { key: "nombre", label: "Nombre" },
  { key: "asignatura", label: "Núcleo, asignatura y/o módulo" },
  { key: "telefono", label: "Teléfono" },
  { key: "correo", label: "Correo Electrónico" },
];

const especialistaColumns = [
  { key: "nombre", label: "Nombre" },
  { key: "especialidad", label: "Especialidad" },
  { key: "telefono", label: "Teléfono" },
  { key: "correo", label: "Correo Electrónico" },
];

const coordinacionColumns = [
  { key: "label", label: "" },
  { key: "nombre", label: "Nombre" },
  { key: "telefono", label: "Teléfono" },
  { key: "correo", label: "Correo Electrónico" },
];

const coordinacionRows = [
  { key: "establecimiento", label: "En el establecimiento" },
  { key: "daem", label: "En el DAEM", helper: "(si el PIE es comunal)" },
  { key: "redes", label: "Con Redes de Apoyo" },
];

const daysOfWeek = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

const timeSlots = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
];

const semesterConfigs = [
  { key: "primer", label: "Primer Semestre", months: ["Marzo", "Abril", "Mayo", "Junio", "Julio"] },
  {
    key: "segundo",
    label: "Segundo Semestre",
    months: ["Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
  },
];

const createRowFromColumns = (columns) => {
  const base = columns.reduce((acc, column) => {
    if (column.key !== "label") acc[column.key] = "";
    return acc;
  }, {});
  base.usuario_id = null;
  return base;
};

const ensureRowArray = (rows, minLength, columns) => {
  const normalized = Array.isArray(rows)
    ? rows.map((row) => ({ ...createRowFromColumns(columns), ...row, usuario_id: row?.usuario_id ?? null }))
    : [];
  while (normalized.length < minLength) {
    normalized.push(createRowFromColumns(columns));
  }
  return normalized;
};

const createCoordinacionRow = (config) => ({
  key: config.key,
  label: config.label,
  helper: config.helper || "",
  nombre: "",
  telefono: "",
  correo: "",
});

const ensureCoordinacionRows = (rows) => {
  const map = Array.isArray(rows)
    ? rows.reduce((acc, row) => {
        if (row?.key) acc[row.key] = row;
        return acc;
      }, {})
    : {};
  return coordinacionRows.map((config) => ({
    ...createCoordinacionRow(config),
    ...(map[config.key] || {}),
  }));
};

const createCalendarEntry = () => ({ fecha: "", inicio: "", termino: "" });

const createCalendar = (months) =>
  daysOfWeek.reduce((acc, day) => {
    acc[day] = months.reduce((innerAcc, month) => {
      innerAcc[month] = createCalendarEntry();
      return innerAcc;
    }, {});
    return acc;
  }, {});

const ensureCalendar = (calendar, months) => {
  const base = createCalendar(months);
  const safe = calendar || {};
  return Object.keys(base).reduce((acc, day) => {
    acc[day] = months.reduce((monthAcc, month) => {
      monthAcc[month] = {
        ...createCalendarEntry(),
        ...(safe?.[day]?.[month] || {}),
      };
      return monthAcc;
    }, {});
    return acc;
  }, {});
};

const createAgreementRow = () => ({ reunion: "", asistentes: "", acuerdos: "" });

const ensureAgreements = (rows, min = 3) => {
  const normalized = Array.isArray(rows)
    ? rows.map((row) => ({ ...createAgreementRow(), ...row }))
    : [];
  while (normalized.length < min) {
    normalized.push(createAgreementRow());
  }
  return normalized;
};
const formatUsuarioNombre = (usuario) => {
  if (!usuario) return "";
  const nombreCompuesto =
    usuario.nombre_completo ||
    [usuario.first_name, usuario.last_name].filter(Boolean).join(" ").trim();
  return nombreCompuesto || usuario.username || usuario.email || `Usuario #${usuario.id}`;
};

const pickTelefono = (usuario) =>
  usuario?.telefono || usuario?.phone || usuario?.phone_number || usuario?.celular || "";

export default function EquipoAulaSection({
  value,
  setValue,
  onSave,
  usuarios = [],
  usuariosCargando = false,
}) {
  const [activeBlock, setActiveBlock] = useState("docentes");
  const [saving, setSaving] = useState(false);
  const data = ensureEquipoAula(value);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await postEquipoAula(data);
      if (onSave) {
        await onSave(data);
      }
    } catch (error) {
      console.error("No se pudo guardar la sección Equipo de Aula.", error);
    } finally {
      setSaving(false);
    }
  };

  const updateValue = (updater) => {
    setValue((prev) => updater(ensureEquipoAula(prev)));
  };

  const handleBlockCellChange = (sectionKey, rowIdx, field, newValue) => {
    if (field === "label") return;
    updateValue((current) => ({
      ...current,
      [sectionKey]: current[sectionKey].map((row, idx) =>
        idx === rowIdx ? { ...row, [field]: newValue } : row
      ),
    }));
  };

  const handleAddRow = (sectionKey, columns) => {
    updateValue((current) => ({
      ...current,
      [sectionKey]: [...current[sectionKey], createRowFromColumns(columns)],
    }));
  };

  const handleRemoveRow = (sectionKey) => {
    updateValue((current) => {
      if ((current[sectionKey]?.length || 0) <= 1) return current;
      return { ...current, [sectionKey]: current[sectionKey].slice(0, -1) };
    });
  };

  const handleUsuarioSelect = (sectionKey, rowIdx, usuarioId) => {
    const usuario = usuarios.find((item) => String(item.id) === String(usuarioId));
    updateValue((current) => ({
      ...current,
      [sectionKey]: current[sectionKey].map((row, idx) => {
        if (idx !== rowIdx) return row;
        const updated = { ...row, usuario_id: usuario ? usuario.id : null };
        if (usuario) {
          updated.nombre = formatUsuarioNombre(usuario);
          if (typeof row.telefono !== "undefined") {
            updated.telefono = pickTelefono(usuario) || row.telefono;
          }
          if (typeof row.correo !== "undefined") {
            updated.correo = usuario.email || row.correo;
          }
        } else if (!usuarioId) {
          updated.usuario_id = null;
        }
        return updated;
      }),
    }));
  };

  const handleCalendarChange = (semesterKey, day, month, field, newValue) => {
    updateValue((current) => {
      const semester = current.reuniones[semesterKey];
      return {
        ...current,
        reuniones: {
          ...current.reuniones,
          [semesterKey]: {
            ...semester,
            calendario: {
              ...semester.calendario,
              [day]: {
                ...semester.calendario[day],
                [month]: {
                  ...semester.calendario[day][month],
                  [field]: newValue,
                },
              },
            },
          },
        },
      };
    });
  };

  const handleAgreementChange = (semesterKey, index, field, newValue) => {
    updateValue((current) => {
      const semester = current.reuniones[semesterKey];
      const updated = semester.acuerdos.map((row, idx) =>
        idx === index ? { ...row, [field]: newValue } : row
      );
      return {
        ...current,
        reuniones: {
          ...current.reuniones,
          [semesterKey]: { ...semester, acuerdos: updated },
        },
      };
    });
  };

  const handleAgreementAdd = (semesterKey) => {
    updateValue((current) => {
      const semester = current.reuniones[semesterKey];
      return {
        ...current,
        reuniones: {
          ...current.reuniones,
          [semesterKey]: {
            ...semester,
            acuerdos: [...semester.acuerdos, createAgreementRow()],
          },
        },
      };
    });
  };

  const handleAgreementRemove = (semesterKey) => {
    updateValue((current) => {
      const semester = current.reuniones[semesterKey];
      if (semester.acuerdos.length <= 1) return current;
      return {
        ...current,
        reuniones: {
          ...current.reuniones,
          [semesterKey]: {
            ...semester,
            acuerdos: semester.acuerdos.slice(0, -1),
          },
        },
      };
    });
  };

  const blocks = [
    {
      key: "docentes",
      title: "Docente(s) de educación regular del curso",
      columns: docenteColumns,
      addable: true,
    },
    { key: "especialistas", title: "Profesores especializados", columns: especialistaColumns, addable: true },
    {
      key: "asistentes",
      title: "Profesionales especializados asistentes de la educación",
      columns: especialistaColumns,
      addable: true,
    },
    {
      key: "coordinacion",
      title: "Coordinación del Programa",
      columns: coordinacionColumns,
      addable: false,
    },
  ];

  const currentBlock = blocks.find((block) => block.key === activeBlock) ?? blocks[0];
  const currentRows = data[currentBlock.key] || [];

  return (
    <section className="card border-0 shadow-sm">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
          <div>
            <p className="text-uppercase text-muted small mb-1">Educación Especial</p>
            <h4 className="fw-bold mb-0">
              I EQUIPO DE AULA <sup>1</sup>
            </h4>
            <p className="mb-0 text-secondary">1.- Identificación del Equipo de Aula</p>
          </div>
          <div className="d-flex gap-2 align-items-start flex-wrap">
            <div className="d-flex gap-2">
              <div className="rounded-2 bg-primary" style={{ width: 48, height: 48 }} />
              <div className="rounded-2 bg-info" style={{ width: 48, height: 48 }} />
            </div>
            {onSave && (
              <button
                type="button"
                className="btn btn-primary"
                disabled={saving}
                onClick={handleSave}
              >
                {saving ? "Guardando..." : "Guardar sección"}
              </button>
            )}
          </div>
        </div>

        <div className="row">
          <div className="col-lg-4 col-xl-3 mb-3">
            <div className="list-group shadow-sm">
              {blocks.map((block) => (
                <button
                  key={block.key}
                  type="button"
                  className={`list-group-item list-group-item-action ${
                    activeBlock === block.key ? "active" : ""
                  }`}
                  onClick={() => setActiveBlock(block.key)}
                >
                  {block.title}
                </button>
              ))}
            </div>
          </div>
          <div className="col-lg-8 col-xl-9">
            <TableBlock
              title={currentBlock.title}
              columns={currentBlock.columns}
              rows={currentRows}
              onCellChange={(rowIdx, field, newValue) =>
                handleBlockCellChange(currentBlock.key, rowIdx, field, newValue)
              }
              onAddRow={() => handleAddRow(currentBlock.key, currentBlock.columns)}
              onRemoveRow={() => handleRemoveRow(currentBlock.key)}
              showAddButton={currentBlock.addable}
              showRemoveButton={currentBlock.addable && currentRows.length > 1}
              usuarios={usuarios}
              usuariosCargando={usuariosCargando}
              onSelectUsuario={(rowIdx, userId) =>
                handleUsuarioSelect(currentBlock.key, rowIdx, userId)
              }
            />
          </div>
        </div>
      </div>

      <hr className="my-4" />

      <div>
        <p className="text-uppercase text-muted small mb-1">Educación Especial</p>
        <h4 className="fw-bold mb-0">
          2.- Reuniones de Coordinación del Equipo de Aula <sup>2</sup>
        </h4>
        <p className="text-secondary mb-4" style={{ maxWidth: 720 }}>
          Es importante planificar las reuniones, definir los tiempos, el tema y responsables, además de
          registrar la asistencia y los acuerdos para dar seguimiento a los compromisos.
        </p>

        {semesterConfigs.map((semester) => (
          <div key={semester.key} className="mb-5">
            <p className="text-primary fw-semibold mb-2">{semester.label}</p>
            <CalendarTable
              months={semester.months}
              values={data.reuniones[semester.key].calendario}
              onCellChange={(day, month, field, newValue) =>
                handleCalendarChange(semester.key, day, month, field, newValue)
              }
            />
            <AgreementsTable
              rows={data.reuniones[semester.key].acuerdos}
              onAdd={() => handleAgreementAdd(semester.key)}
              onRemove={() => handleAgreementRemove(semester.key)}
              onChange={(index, field, newValue) =>
                handleAgreementChange(semester.key, index, field, newValue)
              }
            />
          </div>
        ))}
      </div>
    </section>
  );
}

const createMeetingSection = (months) => ({
  calendario: createCalendar(months),
  acuerdos: ensureAgreements([], 3),
});

const ensureMeetingSection = (section, months) => ({
  calendario: ensureCalendar(section?.calendario, months),
  acuerdos: ensureAgreements(section?.acuerdos, 1),
});

export const createEquipoAulaDefault = () => ({
  docentes: ensureRowArray([], 2, docenteColumns),
  especialistas: ensureRowArray([], 2, especialistaColumns),
  asistentes: ensureRowArray([], 2, especialistaColumns),
  coordinacion: ensureCoordinacionRows([]),
  reuniones: semesterConfigs.reduce((acc, semester) => {
    acc[semester.key] = createMeetingSection(semester.months);
    return acc;
  }, {}),
});

const ensureEquipoAula = (value) => ({
  ...createEquipoAulaDefault(),
  ...value,
  docentes: ensureRowArray(value?.docentes, value?.docentes?.length || 2, docenteColumns),
  especialistas: ensureRowArray(
    value?.especialistas,
    value?.especialistas?.length || 2,
    especialistaColumns
  ),
  asistentes: ensureRowArray(value?.asistentes, value?.asistentes?.length || 2, especialistaColumns),
  coordinacion: ensureCoordinacionRows(value?.coordinacion),
  reuniones: semesterConfigs.reduce((acc, semester) => {
    acc[semester.key] = ensureMeetingSection(value?.reuniones?.[semester.key], semester.months);
    return acc;
  }, {}),
});

const TableBlock = ({
  title,
  columns,
  rows,
  onCellChange,
  onAddRow,
  onRemoveRow,
  showAddButton,
  showRemoveButton,
  usuarios = [],
  usuariosCargando = false,
  onSelectUsuario,
}) => (
  <div className="mb-4">
    <div className="d-flex justify-content-between align-items-center mb-2 gap-2 flex-wrap">
      <h6 className="fw-semibold text-primary mb-0">{title}</h6>
      <div className="d-flex gap-2 flex-wrap">
        {showRemoveButton && (
          <button
            type="button"
            className="btn btn-outline-danger btn-sm"
            onClick={onRemoveRow}
          >
            Quitar fila
          </button>
        )}
        {showAddButton && (
          <button type="button" className="btn btn-outline-primary btn-sm" onClick={onAddRow}>
            Agregar fila
          </button>
        )}
      </div>
    </div>
    <div className="table-responsive">
      <table className="table table-bordered align-middle mb-0">
        <thead className="table-light">
          <tr>
            {columns.map((column) => (
              <th key={`${title}-${column.key}`}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr key={row.key || `${title}-${rowIdx}`}>
              {columns.map((column) => (
                <td key={`${column.key}-${rowIdx}`}>
                  {column.key === "label" ? (
                    <div className="fw-semibold">
                      {row.label}
                      {row.helper && <div className="small text-muted">{row.helper}</div>}
                    </div>
                  ) : column.key === "nombre" ? (
                    <div className="d-flex flex-column gap-2">
                      <select
                        className="form-select form-select-sm"
                        value={row.usuario_id ?? ""}
                        onChange={(e) => onSelectUsuario?.(rowIdx, e.target.value || null)}
                        disabled={usuariosCargando && !usuarios.length}
                      >
                        <option value="">
                          {usuariosCargando ? "Cargando usuarios..." : "Seleccionar usuario"}
                        </option>
                        {usuarios.map((usuario) => (
                          <option key={`usuario-${usuario.id}`} value={usuario.id}>
                            {formatUsuarioNombre(usuario)}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        className="form-control form-control-sm border-0 shadow-none"
                        placeholder={column.label}
                        value={row[column.key] || ""}
                        onChange={(e) => onCellChange(rowIdx, column.key, e.target.value)}
                      />
                    </div>
                  ) : (
                    <input
                      type="text"
                      className="form-control form-control-sm border-0 shadow-none"
                      placeholder={column.label}
                      value={row[column.key] || ""}
                      onChange={(e) => onCellChange(rowIdx, column.key, e.target.value)}
                    />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const CalendarTable = ({ months, values, onCellChange }) => (
  <div className="table-responsive mb-3">
    <table className="table table-bordered align-middle mb-0">
      <thead className="table-light">
        <tr>
          <th style={{ width: 140 }}></th>
          {months.map((month) => (
            <th key={month} colSpan={2} className="text-center">
              {month}
            </th>
          ))}
        </tr>
        <tr>
          <th></th>
          {months.map((month) => (
            <React.Fragment key={`${month}-headers`}>
              <th>Fecha</th>
              <th>Horario</th>
            </React.Fragment>
          ))}
        </tr>
      </thead>
      <tbody>
        {daysOfWeek.map((day) => (
          <tr key={day}>
            <td className="fw-semibold">{day}</td>
            {months.map((month) => (
              <React.Fragment key={`${day}-${month}`}>
                <td>
                  <input
                    type="date"
                    className="form-control form-control-sm border-0 shadow-none"
                    value={values?.[day]?.[month]?.fecha || ""}
                    onChange={(e) => onCellChange(day, month, "fecha", e.target.value)}
                  />
                </td>
                <td>
                  <div className="d-flex flex-column flex-md-row gap-2">
                    {(["inicio", "termino"]).map((field) => (
                      <div key={`${field}-${day}-${month}`} className="flex-grow-1">
                        <label
                          className="form-label text-muted mb-1 small text-capitalize"
                          htmlFor={`${field}-${day}-${month}`}
                        >
                          {field === "inicio" ? "Inicio" : "Término"}
                        </label>
                        <input
                          id={`${field}-${day}-${month}`}
                          type="time"
                          className="form-control form-control-sm"
                          value={values?.[day]?.[month]?.[field] || ""}
                          onChange={(e) => onCellChange(day, month, field, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </td>
              </React.Fragment>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const AgreementsTable = ({ rows, onAdd, onRemove, onChange }) => (
  <div className="mb-4">
    <div className="d-flex justify-content-between align-items-center mb-2 gap-2 flex-wrap">
      <h6 className="fw-semibold text-primary mb-0">Registro de reuniones</h6>
      <div className="d-flex gap-2">
        <button type="button" className="btn btn-outline-danger btn-sm" onClick={onRemove}>
          Quitar fila
        </button>
        <button type="button" className="btn btn-outline-primary btn-sm" onClick={onAdd}>
          Agregar fila
        </button>
      </div>
    </div>
    <div className="table-responsive">
      <table className="table table-bordered align-middle mb-0">
        <thead className="table-light">
          <tr>
            <th>REUNIÓN/FECHA</th>
            <th>ASISTENTES</th>
            <th>ACUERDOS</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={`acuerdo-${idx}`}>
              <td>
                <input
                  type="text"
                  className="form-control form-control-sm border-0 shadow-none"
                  placeholder="Detalle de la reunión"
                  value={row.reunion || ""}
                  onChange={(e) => onChange(idx, "reunion", e.target.value)}
                />
              </td>
              <td>
                <input
                  type="text"
                  className="form-control form-control-sm border-0 shadow-none"
                  placeholder="Participantes"
                  value={row.asistentes || ""}
                  onChange={(e) => onChange(idx, "asistentes", e.target.value)}
                />
              </td>
              <td>
                <textarea
                  className="form-control form-control-sm border-0 shadow-none"
                  rows={1}
                  placeholder="Acuerdos alcanzados"
                  value={row.acuerdos || ""}
                  onChange={(e) => onChange(idx, "acuerdos", e.target.value)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
