import { PIE } from "../../wj-content/wj-textos";
import { CONTACTO, LOGO_RESPALDO_URL, LOGO_URL } from "../../wj-content/wj-enlaces";

export default function Footer() {
  return (
    <footer className="border-t border-ink/10 py-12">
      <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-3 gap-8 font-mono text-xs text-ink/40">
        <div>
          <picture>
            <source srcSet={LOGO_URL} type="image/webp" />
            <img
              src={LOGO_RESPALDO_URL}
              width={1792}
              height={522}
              alt={PIE.columna1Titulo}
              className="h-12 w-auto mb-4"
            />
          </picture>
          {PIE.columna1Lineas.map((linea) => (
            <p key={linea}>{linea}</p>
          ))}
        </div>
        <div>
          <p className="text-ink/70 mb-2">{PIE.columna2Titulo}</p>
          <p>
            <a
              href={`mailto:${CONTACTO.correo}`}
              className="hover:text-sky-ink transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-ink"
            >
              {CONTACTO.correo}
            </a>
          </p>
          <p>
            <a
              href={CONTACTO.web}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-sky-ink transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-ink"
            >
              {CONTACTO.webEtiqueta}
            </a>
          </p>
        </div>
        <div className="md:text-right">
          <p className="text-ink/70 mb-2">{PIE.columna3Titulo}</p>
          {PIE.columna3Lineas.map((linea) => (
            <p key={linea}>{linea}</p>
          ))}
        </div>
      </div>
    </footer>
  );
}
