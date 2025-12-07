import { createClient } from "npm:@supabase/supabase-js";

const kvClient = () =>
  createClient(
    Deno.env.get("SUPABASE_URL"),
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
  );

export const kv = {
  set: async (key: string, value: any): Promise<void> => {
    const supabase = kvClient();
    const { error } = await supabase
      .from("kv_store_f659121d")
      .upsert({ key, value });
    if (error) throw new Error(error.message);
  },

  get: async (key: string): Promise<any> => {
    const supabase = kvClient();
    const { data, error } = await supabase
      .from("kv_store_f659121d")
      .select("value")
      .eq("key", key)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data?.value;
  },

  del: async (key: string): Promise<void> => {
    const supabase = kvClient();
    const { error } = await supabase
      .from("kv_store_f659121d")
      .delete()
      .eq("key", key);
    if (error) throw new Error(error.message);
  },

  mset: async (
    keys: string[],
    values: any[],
  ): Promise<void> => {
    const supabase = kvClient();
    const { error } = await supabase
      .from("kv_store_f659121d")
      .upsert(
        keys.map((k, i) => ({ key: k, value: values[i] })),
      );
    if (error) throw new Error(error.message);
  },

  mget: async (keys: string[]): Promise<any[]> => {
    const supabase = kvClient();
    const { data, error } = await supabase
      .from("kv_store_f659121d")
      .select("value")
      .in("key", keys);
    if (error) throw new Error(error.message);
    return data?.map((d) => d.value) ?? [];
  },

  mdel: async (keys: string[]): Promise<void> => {
    const supabase = kvClient();
    const { error } = await supabase
      .from("kv_store_f659121d")
      .delete()
      .in("key", keys);
    if (error) throw new Error(error.message);
  },

  getByPrefix: async (prefix: string): Promise<any[]> => {
    const supabase = kvClient();
    const { data, error } = await supabase
      .from("kv_store_f659121d")
      .select("key, value")
      .like("key", prefix + "%");
    if (error) throw new Error(error.message);
    return data?.map((d) => d.value) ?? [];
  },
};
