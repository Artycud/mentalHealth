import { LocationPin } from '@/components/illustrations/icons';

import styles from './booth.module.css';

export function BoothLabelPill({ children }: { children: string }) {
  return <span className={styles.label}>{children}</span>;
}

interface BoothTicketProps {
  title: string;
  body: string;
  /** Location and date, e.g. "ที่โรงอาหาร [วันที่จัดบูธ]". */
  where: string;
}

export function BoothTicket({ title, body, where }: BoothTicketProps) {
  return (
    <section className={styles.ticket}>
      <h2 className={styles.ticketTitle}>{title}</h2>
      <p className={styles.ticketBody}>{body}</p>
      <div className={styles.where}>
        <LocationPin />
        <span className={styles.whereText}>{where}</span>
      </div>
    </section>
  );
}
