/** Contenido del modal "¿Qué es Rumbo?" — el título/descripción los pone el <Modal> que lo envuelve. */
export function AboutRumboContent() {
  return (
    <div className="flex flex-col gap-4 text-sm text-[var(--text-secondary)]">
      <p>
        Tu panel personal de salud financiera: ingresos, gastos, deudas, ahorro y patrimonio en un solo sitio, con
        un score explicado factor a factor. Para un único usuario, con tus datos 100% locales (nunca en la nube) y
        copia de seguridad automática.
      </p>
      <ul className="list-disc space-y-1.5 pl-5">
        <li>Vincula el fondo de emergencia, inversiones y propiedades a una cuenta real para que se actualicen solos.</li>
        <li>Importa tus extractos bancarios de vez en cuando para no perder gastos recurrentes.</li>
      </ul>
    </div>
  );
}
