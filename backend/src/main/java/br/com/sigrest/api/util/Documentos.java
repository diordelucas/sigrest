package br.com.sigrest.api.util;

/**
 * Normalização e validação de dígito verificador de CPF/CNPJ (inspirado em
 * {@code Documentos.java} do mpg-gestao — ver PLANO_ACAO_COMPLETO.md, item 8).
 *
 * <p>CPF e CNPJ são campos opcionais em {@code Person}/{@code Supplier}: os métodos aqui só
 * verificam o dígito verificador quando o valor não está em branco — cadastro sem documento
 * continua permitido.
 */
public final class Documentos {

    private Documentos() {
    }

    /** Remove tudo que não for dígito. */
    public static String apenasDigitos(String valor) {
        return valor == null ? "" : valor.replaceAll("\\D", "");
    }

    public static boolean isValidCPF(String cpf) {
        String digits = apenasDigitos(cpf);
        if (digits.length() != 11 || todosDigitosIguais(digits)) {
            return false;
        }
        int dv1 = calcularDigitoVerificador(digits.substring(0, 9), new int[]{10, 9, 8, 7, 6, 5, 4, 3, 2});
        int dv2 = calcularDigitoVerificador(digits.substring(0, 9) + dv1, new int[]{11, 10, 9, 8, 7, 6, 5, 4, 3, 2});
        return digits.equals(digits.substring(0, 9) + dv1 + dv2);
    }

    public static boolean isValidCNPJ(String cnpj) {
        String digits = apenasDigitos(cnpj);
        if (digits.length() != 14 || todosDigitosIguais(digits)) {
            return false;
        }
        int[] pesos1 = {5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2};
        int[] pesos2 = {6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2};
        int dv1 = calcularDigitoVerificador(digits.substring(0, 12), pesos1);
        int dv2 = calcularDigitoVerificador(digits.substring(0, 12) + dv1, pesos2);
        return digits.equals(digits.substring(0, 12) + dv1 + dv2);
    }

    private static int calcularDigitoVerificador(String base, int[] pesos) {
        int soma = 0;
        for (int i = 0; i < pesos.length; i++) {
            soma += Character.getNumericValue(base.charAt(i)) * pesos[i];
        }
        int resto = soma % 11;
        return resto < 2 ? 0 : 11 - resto;
    }

    private static boolean todosDigitosIguais(String digits) {
        return digits.chars().distinct().count() == 1;
    }
}
