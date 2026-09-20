import { admin } from '@/content/th/admin';
import { festivals, festivalOrder } from '@/content/th/booth';
import type { Filters as FilterValues } from '@/lib/admin-data';

import styles from './admin.module.css';

/**
 * The filters (BRIEF §11). A plain GET form, so it works without any script, can be
 * bookmarked, and the export links can carry the very same filters.
 */
export function Filters({ values }: { values: FilterValues }) {
  return (
    <form className={styles.filters} method="get" action="/admin" aria-label={admin.filters.heading}>
      <label className={styles.field}>
        {admin.filters.from}
        <input className={styles.input} type="date" name="from" defaultValue={values.from ?? ''} />
      </label>
      <label className={styles.field}>
        {admin.filters.to}
        <input className={styles.input} type="date" name="to" defaultValue={values.to ?? ''} />
      </label>
      <label className={styles.field}>
        {admin.filters.mode}
        <select className={styles.select} name="mode" defaultValue={values.mode ?? ''}>
          <option value="">{admin.filters.all}</option>
          <option value="checkin">{admin.modes.checkin}</option>
          <option value="booth">{admin.modes.booth}</option>
        </select>
      </label>
      <label className={styles.field}>
        {admin.filters.status}
        <select className={styles.select} name="status" defaultValue={values.status ?? ''}>
          <option value="">{admin.filters.all}</option>
          <option value="done">{admin.status.done}</option>
          <option value="open">{admin.status.open}</option>
        </select>
      </label>
      <label className={styles.field}>
        {admin.filters.festival}
        <select className={styles.select} name="festival" defaultValue={values.festival ?? ''}>
          <option value="">{admin.filters.all}</option>
          {festivalOrder.map((id) => (
            <option key={id} value={id}>
              {festivals[id].name}
            </option>
          ))}
        </select>
      </label>
      <label className={styles.field}>
        {admin.filters.search}
        <input className={styles.input} name="q" defaultValue={values.q ?? ''} placeholder={admin.filters.searchHint} maxLength={36} autoCapitalize="none" spellCheck={false} />
      </label>
      <div className={styles.filterActions}>
        <button className={styles.button} type="submit">
          {admin.filters.apply}
        </button>
        <a className={styles.linkButton} href="/admin" style={{ display: 'inline-flex', alignItems: 'center' }}>
          {admin.filters.clear}
        </a>
      </div>
    </form>
  );
}
