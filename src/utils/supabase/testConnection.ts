import { supabase } from './client';

export interface DatabaseStatus {
  connected: boolean;
  schemaReady: boolean;
  usersExist: boolean;
  storageReady: boolean;
  errors: string[];
}

export async function testDatabaseConnection(): Promise<DatabaseStatus> {
  const status: DatabaseStatus = {
    connected: false,
    schemaReady: false,
    usersExist: false,
    storageReady: false,
    errors: [],
  };

  try {
    // Test 1: Basic connection
    const { error: pingError } = await supabase.from('users').select('count', { count: 'exact', head: true });
    
    if (pingError) {
      if (pingError.message.includes('relation "public.users" does not exist')) {
        status.errors.push('⚠️ Schema nicht installiert - Führe 001_initial_schema.sql aus');
      } else {
        status.errors.push(`❌ Verbindungsfehler: ${pingError.message}`);
      }
      return status;
    }

    status.connected = true;
    status.schemaReady = true;

    // Test 2: Check if users exist
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (!usersError && users && users.length > 0) {
      status.usersExist = true;
    } else {
      status.errors.push('⚠️ Keine User in der Datenbank - Erstelle Demo-User');
    }

    // Test 3: Check storage buckets
    const { data: buckets, error: storageError } = await supabase.storage.listBuckets();
    
    if (!storageError && buckets) {
      const documentsBucket = buckets.find(b => b.name === 'documents');
      if (documentsBucket) {
        status.storageReady = true;
      } else {
        status.errors.push('⚠️ Storage nicht konfiguriert - Führe 002_storage_setup.sql aus');
      }
    }

    return status;
  } catch (error: any) {
    status.errors.push(`❌ Unerwarteter Fehler: ${error.message}`);
    return status;
  }
}

export async function getSetupProgress(): Promise<{
  progress: number;
  steps: Array<{ name: string; completed: boolean; message: string }>;
}> {
  const status = await testDatabaseConnection();

  const steps = [
    {
      name: 'Datenbankverbindung',
      completed: status.connected,
      message: status.connected ? '✅ Verbunden' : '❌ Nicht verbunden',
    },
    {
      name: 'Schema installiert',
      completed: status.schemaReady,
      message: status.schemaReady ? '✅ Schema bereit' : '⚠️ Schema fehlt',
    },
    {
      name: 'Demo-User erstellt',
      completed: status.usersExist,
      message: status.usersExist ? '✅ User vorhanden' : '⚠️ Keine User',
    },
    {
      name: 'Storage konfiguriert',
      completed: status.storageReady,
      message: status.storageReady ? '✅ Storage bereit' : '⚠️ Storage fehlt',
    },
  ];

  const completedSteps = steps.filter(s => s.completed).length;
  const progress = (completedSteps / steps.length) * 100;

  return { progress, steps };
}