/** Contenido del modal "¿Qué es Rumbo?" — el título/descripción los pone el <Modal> que lo envuelve. */
export function AboutRumboContent() {
  return (
    <div className="flex flex-col gap-5 text-sm text-[var(--text-secondary)]">
      <section>
        <h3 className="mb-1.5 text-sm font-semibold text-[var(--text-primary)]">Para qué sirve</h3>
        <p>
          Rumbo es tu panel personal de salud financiera: ingresos, gastos, deudas, ahorro/inversión y patrimonio
          neto en un solo sitio, con un score explicado factor a factor (nunca un número mágico sin razón). El
          objetivo es dejar de repartir tus cuentas entre varias apps de banco distintas y una hoja de cálculo a
          medio rellenar.
        </p>
      </section>

      <section>
        <h3 className="mb-1.5 text-sm font-semibold text-[var(--text-primary)]">Qué uso real tiene</h3>
        <p>
          Es una app para un único usuario — tú — sin login ni cuentas de otras personas. Tus datos viven en tu
          propio Postgres local, nunca en la nube: puedes editar y borrar sin miedo, hay copia de seguridad
          automática diaria y también cada vez que guardas un snapshot en "Historial". No sustituye a un asesor
          financiero — el score y las recomendaciones son reglas fijas y transparentes, no un consejo personalizado.
        </p>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">Consejos de uso</h3>
        <ul className="list-disc space-y-2 pl-5">
          <li>Da de alta primero tus cuentas reales (Ingresos y Gastos → + Añadir cuenta) y luego tus movimientos.</li>
          <li>
            Vincula el fondo de emergencia y las inversiones a una cuenta real (Ahorro) para que su saldo se
            actualice solo cada mes, sin tocarlo a mano.
          </li>
          <li>
            Si tienes una propiedad en alquiler, créala en Ahorro y vincula el ingreso/gasto a ella desde el
            desplegable (no solo una nota de texto) para ver el beneficio neto real.
          </li>
          <li>
            Importa tus extractos bancarios de vez en cuando (Ingresos y Gastos → Importar movimientos) para
            detectar gastos recurrentes que se te hayan colado sin apuntar.
          </li>
          <li>
            Guarda un snapshot cada mes en Historial: además de ver tu evolución, dispara una copia de seguridad
            real de la base de datos.
          </li>
          <li>
            Usa el Simulador para ver el impacto de un cambio (subida de sueldo, gasto nuevo, más ahorro...) sin
            tocar tus datos reales.
          </li>
        </ul>
      </section>
    </div>
  );
}
